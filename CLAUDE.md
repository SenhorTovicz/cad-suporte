# CAD Suporte — instruções para o Claude

App PWA (Three.js r128 + JS puro + HTML/CSS, publicado no GitHub Pages) para projetar e orçar
peças metálicas de proteção de obra: suporte de tela, grade de poço, guincho, proteção de
sacada e afastador de suporte SLQA. Cada aba tem modelo 3D, tabela de custo e projeto técnico
em PDF (`js/projeto.js`).

## Fluxo de trabalho combinado com o dono do projeto

- **Mesclar sempre, sem perguntar.** Depois de implementar e testar uma mudança: commit,
  push, abrir a PR e **mesclar direto na `main`**. Não perguntar "quer que eu mescle?".
- Antes de cada mudança nova, recriar a branch de trabalho a partir da `main` atualizada
  (as PRs anteriores já foram mescladas).
- Responder em português, de forma direta.

## Ao mexer no app

- Toda mudança em arquivo do app deve **aumentar a versão do cache** em `service-worker.js`
  (`CACHE_NAME = 'cad-suporte-vNN'`) para o PWA atualizar sozinho no celular/PC. Arquivo JS
  novo também entra na lista `ARQUIVOS_APP`.
- Testar no navegador antes de mesclar (Playwright com o Chromium em
  `/opt/pw-browsers/chromium`): abrir a aba, conferir os valores da tabela, gerar o projeto
  em PDF e verificar que não há erros no console.
- Preços e campos editáveis que o usuário define ficam salvos no aparelho via
  `initCampoPersistente` (localStorage).
