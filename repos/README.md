# repos/

Pasta dos repositórios deste workspace Makuco.

Coloque aqui, lado a lado, os repositórios que compõem o produto — clonados pelo `makuco init` ou manualmente com `git clone`.

```
repos/
├── minha-api/
├── meu-front/
└── README.md
```

## Índice

Cada repositório é listado em `MAKUCO.md`, na raiz do workspace, na seção delimitada pelos marcadores `makuco:repos:start` e `makuco:repos:end`. Essa seção pertence ao Makuco: quem escreve nela é o `makuco init` (a lista de repositórios) e a skill `makuco-project-research` (a descrição de cada um e, depois da pesquisa completa, os sub-bullets com o mapa de módulos do repositório). Não edite à mão, e não mexa nos marcadores.

Depois de adicionar um repositório manualmente:

1. Rode `makuco init` novamente para reindexar o `MAKUCO.md`.
2. Rode a skill `makuco-project-research` para preencher a descrição de cada repositório.

> **Atenção ao reindexar.** `makuco init` é uma reinstalação completa, não só um reindex: ele sobrescreve as skills instaladas e repergunta as configurações. Quando ele perguntar se deseja sobrescrever o `MAKUCO.md` existente, responda **não** — sobrescrever descarta as descrições já preenchidas. E não use `makuco init --force` para reindexar: `--force` sobrescreve o `MAKUCO.md` sem perguntar, apagando o índice e as políticas do time.

## Workspace de repositório único

Esta pasta pode não conter nenhum repositório — só este `README.md`. Nesse caso o contexto do código vive em `.makuco/docs/codebase/` na raiz do workspace, e não em `repos/<nome>/.makuco/docs/codebase/`.
