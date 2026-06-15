# Teleprompter Overlay

App de teleprompter que flutua **sempre no topo**, ideal para ler roteiros durante reuniões no Google Meet (ou qualquer outra coisa).

## Como rodar

```powershell
npm install      # só na primeira vez
npm start
```

## Recursos

- **Overlay flutuante** sem moldura, arrastável pela barra superior e redimensionável pela alça no canto inferior direito.
- **Sempre no topo** — fica acima do navegador e até de janelas em tela cheia.
- **Fundo** preto, branco ou transparente, com **opacidade** ajustável.
- **Rolagem automática** com controle de velocidade **ou** rolagem manual (roda do mouse).
- **Tamanho da fonte**, espaçamento, cor do texto e linha de leitura ajustáveis.
- **Ocultar do compartilhamento de tela** — se você compartilhar a tela no Meet, o teleprompter não aparece para os outros participantes.
- **Modo clique-através** — os cliques passam direto para o Meet enquanto o texto rola sozinho.
- **Idiomas** — interface em Português, English e Español. Detecta o idioma do sistema na primeira vez e pode ser trocado em Configurações ⚙.
- Salva automaticamente o roteiro e as preferências.

## Atalhos globais (funcionam mesmo com o foco no Meet)

| Atalho | Ação |
| --- | --- |
| `Ctrl+Alt+Espaço` | Play / Pause |
| `Ctrl+Alt+↑` / `Ctrl+Alt+↓` | Aumentar / diminuir velocidade |
| `Ctrl+Alt+R` | Voltar ao início |
| `Ctrl+Alt+L` | Ligar/desligar modo clique-através |
| `Ctrl+Alt+H` | Esconder / mostrar o overlay |

Dentro da janela: `Espaço` play/pause, `+`/`−` fonte, `Home` volta ao topo, `Esc` sai da edição.

## Editar o roteiro

Clique no botão **✎** na barra, cole o texto e clique em **✎** de novo para voltar ao modo leitura.
