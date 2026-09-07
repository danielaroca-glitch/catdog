# Research state — <repo>

Working state of `makuco-project-research` for this repository. Regenerable, never a contract: no downstream reader depends on it, and its absence is normal. Read it **first** when it exists, and resume from it instead of restarting.

```yaml
repo: <nome do repo, ou '.' em workspace single-repo>
commit: <git rev-parse --short HEAD no momento da passagem>
pass: <n>
inventory:
  tracked_files: <n>
  top_dirs: []
  extensions: []
  declared_units: []
  units_source: <pom.xml <modules> | settings.gradle | package.json workspaces | pnpm-workspace.yaml | listagem>
done: []
adopted: []
pending: []
modules:
  done: []
  pending: []
  skipped: []
claims_pending: []
index_updated: false
caps_hit: []
```

## Campos

- **commit** — o `HEAD` da passagem. É o que permite um refresh barato: quando o `HEAD` atual difere, rode um diff limitado e reprocesse só o que ele tocou (ver `SKILL.md` § Retomada), em vez de invalidar tudo.
- **inventory** — o resultado do Step 0.5, inline. Existe para que uma retomada **não repita a varredura**. `declared_units` é a fonte do mapa de módulos e da verificação de existência de módulo na reconciliação.
- **done** / **pending** — nomes de arquivo de saída (`stack.md`, `OVERVIEW.md`, …). Um arquivo em `done` para o `commit` corrente é *fresh* e é pulado **sem ser lido**.
- **adopted** — arquivos que já estavam no disco quando este estado foi criado, sem passagem registrada que os explique (o caso de um repositório pesquisado por uma versão anterior da skill). Contam como *fresh*, mas ninguém verificou: a skill diz quais são ao fechar a passagem e um refresh de qualquer um deles fica disponível sob demanda.
- **modules.skipped** — cada entrada carrega o motivo (`core: biblioteca compartilhada`, `common-data: agrupado em core.md`). Sem o motivo, uma passagem futura repesquisa o que já foi deliberadamente descartado.
- **modules.pending** — os módulos que ficaram com `Doc = —` no mapa. É a lista que a skill imprime ao fechar a passagem.
- **claims_pending** — claims dos docs de referência que ficaram fora do orçamento de 20 por passagem.
- **index_updated** — a passagem não está concluída enquanto for `false`. Torna o check de conclusão do Step 10 verificável em vez de apenas escrito.
- **caps_hit** — qual teto foi batido, quando foi. É uma constatação, não uma falha: registra e segue. Um teto nunca é elevado durante a passagem.
