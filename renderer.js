// Fora do Electron (navegador comum) não existe window.tp — usa stubs
// para a interface continuar funcionando e poder ser testada.
if (!window.tp) {
  window.tp = {
    minimize() {}, close() {}, setAlwaysOnTop() {},
    setContentProtection() {}, setClickThrough() {}, onShortcut() {},
  };
}

// ---- Estado e preferências ----
const DEFAULTS = {
  bg: 'black',
  opacity: 55,        // %
  speed: 60,          // pixels por segundo
  fontSize: 34,       // px
  lineHeight: 16,     // *10 (16 => 1.6)
  textColor: 'auto',  // auto | white | black
  alwaysOnTop: true,
  protect: false,
  clickThrough: false,
  readingLine: true,
  mirror: false,
  lang: 'pt',         // pt | en | es
};

const SCRIPT_KEY = 'tp:script';
const SETTINGS_KEY = 'tp:settings';
const LANG_KEY = 'tp:lang'; // escolha explícita de idioma (separada do resto)

let settings = loadSettings();
let scrolling = false;
let lastTs = null;
let scrollPos = 0; // posição de rolagem em ponto flutuante

// ---- Elementos ----
const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const body = document.body;
const viewer = $('viewer');
const textEl = $('text');
const editor = $('editor');

// ---- Persistência ----
function loadSettings() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    saved = {};
  }
  const merged = { ...DEFAULTS, ...saved };
  merged.lang = loadLang(); // idioma: escolha explícita salva ou detecção automática
  return merged;
}
function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
function loadScript() {
  return localStorage.getItem(SCRIPT_KEY) || '';
}
function saveScript(value) {
  localStorage.setItem(SCRIPT_KEY, value);
}

// ---- Idiomas ----
function currentDict() {
  return (window.I18N && window.I18N[settings.lang]) || window.I18N.pt;
}
function applyI18n() {
  const dict = currentDict();
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = dict[el.getAttribute('data-i18n')];
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const v = dict[el.getAttribute('data-i18n-html')];
    if (v != null) el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const v = dict[el.getAttribute('data-i18n-title')];
    if (v != null) el.title = v;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    const v = dict[el.getAttribute('data-i18n-ph')];
    if (v != null) el.placeholder = v;
  });
  document.documentElement.lang = dict._htmlLang || settings.lang;
}
// Mostra o roteiro salvo; se não houver, mostra o texto de introdução no idioma atual.
function refreshDisplayText() {
  const saved = loadScript();
  textEl.textContent = saved && saved.trim() ? saved : currentDict().intro;
}
// Detecta o idioma do sistema na primeira execução (sem escolha salva).
function detectLang() {
  const supported = ['pt', 'en', 'es'];
  const list = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language || ''];
  for (const l of list) {
    const code = String(l).toLowerCase().slice(0, 2);
    if (supported.includes(code)) return code;
  }
  return 'en'; // fallback internacional
}
function loadLang() {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === 'pt' || stored === 'en' || stored === 'es') return stored;
  return detectLang();
}
// Aplica o idioma atual à interface (sem persistir).
function applyLanguage() {
  applyI18n();
  refreshDisplayText();
  setSegActive('langSeg', 'lang', settings.lang);
}
// Escolha explícita do usuário: passa a valer nas próximas aberturas.
function chooseLanguage(lang) {
  settings.lang = lang;
  localStorage.setItem(LANG_KEY, lang);
  saveSettings();
  applyLanguage();
}

// ---- Aplicar configurações na tela ----
function bgToRgb(bg) {
  if (bg === 'white') return '255, 255, 255';
  return '0, 0, 0'; // preto e transparente usam fundo preto, mudando só a opacidade
}

function resolveTextColor() {
  if (settings.textColor === 'white') return '#ffffff';
  if (settings.textColor === 'black') return '#111111';
  // automático: contrasta com o fundo
  if (settings.bg === 'white') return '#111111';
  return '#ffffff';
}

function applySettings() {
  const opacity = settings.bg === 'transparent' ? 0 : settings.opacity / 100;
  root.style.setProperty('--bg-rgb', bgToRgb(settings.bg));
  root.style.setProperty('--bg-alpha', String(opacity));
  root.style.setProperty('--text-color', resolveTextColor());
  root.style.setProperty('--font-size', settings.fontSize + 'px');
  root.style.setProperty('--line-height', (settings.lineHeight / 10).toFixed(1));

  body.classList.toggle('mirror', settings.mirror);
  body.classList.toggle('show-line', settings.readingLine);
  // Sombra ajuda a ler sobre vídeo; em fundo branco fica desnecessária.
  body.classList.toggle('no-shadow', settings.bg === 'white');

  // Sincroniza controles da interface
  $('opacity').value = settings.opacity;
  $('opacityVal').textContent = settings.opacity + '%';
  $('speed').value = settings.speed;
  $('speedVal').textContent = settings.speed;
  $('speedLabel').textContent = settings.speed;
  $('fontSize').value = settings.fontSize;
  $('fontVal').textContent = settings.fontSize + 'px';
  $('lineHeight').value = settings.lineHeight;
  $('lhVal').textContent = (settings.lineHeight / 10).toFixed(1);
  $('alwaysOnTop').checked = settings.alwaysOnTop;
  $('protect').checked = settings.protect;
  $('clickThrough').checked = settings.clickThrough;
  $('readingLine').checked = settings.readingLine;
  $('mirror').checked = settings.mirror;

  setSegActive('bgSeg', 'bg', settings.bg);
  setSegActive('textSeg', 'text', settings.textColor);
}

function setSegActive(segId, attr, value) {
  $(segId).querySelectorAll('.seg-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset[attr] === value);
  });
}

function applyWindowFlags() {
  window.tp.setAlwaysOnTop(settings.alwaysOnTop);
  window.tp.setContentProtection(settings.protect);
  window.tp.setClickThrough(settings.clickThrough);
}

// ---- Auto-rolagem ----
function tick(ts) {
  if (!scrolling) { lastTs = null; return; }
  if (lastTs == null) lastTs = ts;
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  const maxScroll = viewer.scrollHeight - viewer.clientHeight;
  if (maxScroll <= 0) { stop(); return; } // conteúdo cabe na tela, nada a rolar

  // Acumula em ponto flutuante e só então aplica — assim frações < 1px
  // não se perdem no arredondamento do scrollTop.
  scrollPos = Math.min(maxScroll, scrollPos + settings.speed * dt);
  viewer.scrollTop = scrollPos;

  if (scrollPos >= maxScroll - 0.5) { stop(); return; } // chegou ao fim
  requestAnimationFrame(tick);
}

function play() {
  if (!editor.classList.contains('hidden')) return; // não rola no modo edição
  scrollPos = viewer.scrollTop; // sincroniza com a posição atual
  scrolling = true;
  lastTs = null;
  $('btnPlay').textContent = '⏸';
  $('btnPlay').classList.add('active');
  requestAnimationFrame(tick);
}
function stop() {
  scrolling = false;
  $('btnPlay').textContent = '▶';
  $('btnPlay').classList.remove('active');
}
function togglePlay() { scrolling ? stop() : play(); }

function setSpeed(value) {
  settings.speed = Math.max(10, Math.min(300, Math.round(value)));
  $('speed').value = settings.speed;
  $('speedVal').textContent = settings.speed;
  $('speedLabel').textContent = settings.speed;
  saveSettings();
}

function setFontSize(value) {
  settings.fontSize = Math.max(16, Math.min(96, Math.round(value)));
  applySettings();
  saveSettings();
}

// ---- Modo edição ----
function toggleEdit() {
  const editing = editor.classList.toggle('hidden') === false;
  if (editing) {
    stop();
    editor.value = loadScript() || ''; // não joga o texto de introdução no editor
    $('btnEdit').classList.add('active');
    editor.focus();
  } else {
    saveScript(editor.value);
    refreshDisplayText();
    $('btnEdit').classList.remove('active');
    viewer.scrollTop = 0;
    scrollPos = 0;
  }
}

// ---- Configurações: mostrar/ocultar ----
function toggleSettings() {
  const hidden = $('settings').classList.toggle('hidden');
  $('btnSettings').classList.toggle('active', !hidden);
}

// ====================================================================
// Inicialização
// ====================================================================
function init() {
  applySettings();
  applyWindowFlags();
  applyLanguage(); // aplica o idioma (detectado ou salvo) e mostra o roteiro/introdução

  // Botões da barra
  $('btnPlay').onclick = togglePlay;
  $('btnFaster').onclick = () => setSpeed(settings.speed + 10);
  $('btnSlower').onclick = () => setSpeed(settings.speed - 10);
  $('btnFontUp').onclick = () => setFontSize(settings.fontSize + 2);
  $('btnFontDown').onclick = () => setFontSize(settings.fontSize - 2);
  $('btnEdit').onclick = toggleEdit;
  $('btnSettings').onclick = toggleSettings;
  $('btnMin').onclick = () => window.tp.minimize();
  $('btnClose').onclick = () => window.tp.close();

  // Sliders
  $('opacity').oninput = (e) => {
    settings.opacity = +e.target.value;
    applySettings(); saveSettings();
  };
  $('speed').oninput = (e) => setSpeed(+e.target.value);
  $('fontSize').oninput = (e) => setFontSize(+e.target.value);
  $('lineHeight').oninput = (e) => {
    settings.lineHeight = +e.target.value;
    applySettings(); saveSettings();
  };

  // Segmentos (fundo / cor do texto)
  $('bgSeg').querySelectorAll('.seg-btn').forEach((b) => {
    b.onclick = () => { settings.bg = b.dataset.bg; applySettings(); saveSettings(); };
  });
  $('textSeg').querySelectorAll('.seg-btn').forEach((b) => {
    b.onclick = () => { settings.textColor = b.dataset.text; applySettings(); saveSettings(); };
  });
  $('langSeg').querySelectorAll('.seg-btn').forEach((b) => {
    b.onclick = () => chooseLanguage(b.dataset.lang);
  });

  // Checkboxes
  $('alwaysOnTop').onchange = (e) => {
    settings.alwaysOnTop = e.target.checked;
    window.tp.setAlwaysOnTop(settings.alwaysOnTop); saveSettings();
  };
  $('protect').onchange = (e) => {
    settings.protect = e.target.checked;
    window.tp.setContentProtection(settings.protect); saveSettings();
  };
  $('clickThrough').onchange = (e) => {
    settings.clickThrough = e.target.checked;
    window.tp.setClickThrough(settings.clickThrough); saveSettings();
  };
  $('readingLine').onchange = (e) => {
    settings.readingLine = e.target.checked; applySettings(); saveSettings();
  };
  $('mirror').onchange = (e) => {
    settings.mirror = e.target.checked; applySettings(); saveSettings();
  };

  // Salva o roteiro enquanto digita
  editor.oninput = () => saveScript(editor.value);

  // Atalhos locais (quando a janela tem foco)
  window.addEventListener('keydown', (e) => {
    if (!editor.classList.contains('hidden')) {
      if (e.key === 'Escape') toggleEdit();
      return; // não captura outras teclas durante a edição
    }
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'ArrowUp' && e.ctrlKey) { e.preventDefault(); setSpeed(settings.speed + 10); }
    else if (e.key === 'ArrowDown' && e.ctrlKey) { e.preventDefault(); setSpeed(settings.speed - 10); }
    else if (e.key === '+' || e.key === '=') setFontSize(settings.fontSize + 2);
    else if (e.key === '-') setFontSize(settings.fontSize - 2);
    else if (e.key === 'Home') { viewer.scrollTop = 0; scrollPos = 0; }
  });

  // Roda do mouse pausa a auto-rolagem para ajuste manual
  viewer.addEventListener('wheel', () => { if (scrolling) stop(); }, { passive: true });

  // Atalhos globais vindos do processo principal
  window.tp.onShortcut(({ name, value }) => {
    if (name === 'playpause') togglePlay();
    else if (name === 'faster') setSpeed(settings.speed + 10);
    else if (name === 'slower') setSpeed(settings.speed - 10);
    else if (name === 'restart') { viewer.scrollTop = 0; scrollPos = 0; }
    else if (name === 'clickthrough') {
      settings.clickThrough = !!value;
      $('clickThrough').checked = settings.clickThrough;
      saveSettings();
    }
  });

  setupResize();
}

// Redimensionamento manual pela alça (janela sem moldura)
function setupResize() {
  const grip = $('resizeGrip');
  grip.style.pointerEvents = 'auto';
  let startX, startY, startW, startH;

  const onMove = (e) => {
    const dw = e.screenX - startX;
    const dh = e.screenY - startY;
    window.resizeTo(Math.max(340, startW + dw), Math.max(200, startH + dh));
  };
  const onUp = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  grip.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startX = e.screenX; startY = e.screenY;
    startW = window.outerWidth; startH = window.outerHeight;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });
}

init();
