# Segurança — Teleprompter Overlay

Resumo da revisão de segurança do app (v1.2.0).

## Postura geral

- **Sem rede.** O app não faz nenhuma requisição de rede, não tem telemetria e não envia dados a lugar nenhum. Funciona 100% offline.
- **Apenas conteúdo local.** Carrega só arquivos embutidos (`loadFile`); não abre páginas remotas nem permite navegação para fora do app.
- **Dados ficam no seu PC.** O roteiro e as preferências são salvos localmente (armazenamento do app, na pasta de dados do usuário do Windows). Nunca saem da máquina.
- **Sem dependências de runtime de terceiros.** O app empacotado contém apenas os arquivos-fonte do projeto + o runtime do Electron. `npm audit`: **0 vulnerabilidades**.

## Proteções aplicadas (boas práticas do Electron)

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — o renderer é isolado do Node.
- `webSecurity: true` e **Content-Security-Policy restritiva** (`default-src 'none'`, scripts/estilos só de origem própria) — bloqueia execução de conteúdo externo.
- Bloqueio de novas janelas (`setWindowOpenHandler` → deny) e de navegação (`will-navigate` / `will-redirect`).
- O texto do roteiro é exibido via `textContent` (nunca `innerHTML`) — sem risco de injeção a partir do conteúdo colado.
- **Electron 42.x** (Chromium atualizado). Recomenda-se atualizar periodicamente: `npm install electron@latest -D` e reconstruir.

## Pontos de atenção na distribuição

- **Executável não assinado digitalmente.** Na primeira execução o Windows mostra o aviso do SmartScreen
  ("Mais informações" → "Executar assim mesmo"). Isso é esperado para apps sem certificado de assinatura
  (a assinatura é paga). Não indica malware.
- **Verificação de integridade:** distribua os `.exe` por um canal confiável (rede interna, Drive da empresa)
  e confira o **SHA-256** abaixo antes de executar. Para conferir no PowerShell:
  ```powershell
  Get-FileHash "Teleprompter Setup 1.2.0.exe" -Algorithm SHA256
  ```

### SHA-256 desta build (v1.2.0)

```
Teleprompter Setup 1.2.0.exe   4A91345EF04CAC86F3E8473EFCDEE68F12D4B0F132A76F8573DF87CEADC7F5DD
Teleprompter-portable.exe      483F558AD8E7A2F74C6E3D2E7ACE6EAD5467351275B805BE49134B6EBF0EBA5F
```

> Os hashes mudam a cada nova build. Regere-os com o comando acima após reconstruir.
