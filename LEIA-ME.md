# Snoozz Local — reparo para o Chrome atual

Versão 2.5.1.1, adaptação local em 26/10/2026. Código original: Rohan Bhansali, GPL-3.0. Esta é uma modificação local, sem vínculo com o autor original.

## Instalar

1. Abra `chrome://extensions`.
2. Ative **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Escolha `C:\Users\SUN\Projects\MarcaCopia\snoozz-local` (a pasta que contém `manifest.json`).
5. No menu de extensões, fixe **Snoozz Local** se quiser acesso rápido.

Não remova o Snoozz antigo para instalar esta cópia. Esta versão tem identidade própria e armazenamento separado. Os agendamentos antigos não são importados automaticamente. Se tiver um arquivo exportado pelo Snoozz, use **Settings → Import**. Se a extensão antiga estiver bloqueada e não permitir exportar, mantenha-a instalada para uma recuperação separada dos dados. Desinstalar uma extensão pode apagar os dados dela.

## Usar

Abra uma página, clique no Snoozz Local e escolha uma opção ou a data/hora personalizada. A aba é retirada da barra e uma nova aba com a URL é aberta no horário. O painel **See Sleeping Tabs** lista os agendamentos.

Se o computador estiver suspenso ou o Chrome totalmente fechado, a recuperação acontece depois de despertar/reabrir. O agendamento não é um temporizador de precisão. URLs reabertas podem precisar de internet e autenticação.

Cache, MHTML ou descarte da memória não garantem preservar o estado interno de qualquer site. Esta versão não promete restaurar formulários não enviados, vídeo, estado JavaScript ou rolagem; não mantém abas descartadas na barra.

## Reparos

- Manifest V3 e worker sem dependência de `window` ou `document`.
- Reconstrução de alarmes a cada início do worker.
- Abertura confirmada antes de marcar um agendamento como concluído.
- Fila para evitar abertura duplicada em eventos simultâneos.
- Nova tentativa após falhas e progresso por aba para grupos parcialmente abertos.
- Agendamentos de "próxima inicialização" não disparam só por uma atualização da extensão.
- `chrome.action` substitui `browserAction`; eventos dos menus são registrados no início do worker.
- Remoção do envio de eventos de uso e do proxy remoto de favicons. O seletor legado de telemetria não envia dados nesta versão.

Som de notificação em segundo plano não foi portado; notificações visuais continuam disponíveis. As abas e páginas reais ainda fazem suas próprias conexões.

## Origem

Base: https://github.com/rohanb10/snoozz-tab-snoozing, tag `v2.5`, commit `7123d0387888ac5caba9ad2d50ea61a9ade7e3ec`.

Os hashes dos arquivos `scripts/background.js` e `scripts/common.js` dessa tag, normalizados para LF, correspondem exatamente aos recuperados na análise REA do pacote instalado `2.5_0`.

Mantido o arquivo LICENSE original. As alterações e todos os scripts são fornecidos como código-fonte legível.
