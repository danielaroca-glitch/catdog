# Step 2B: Solution Brainstorming (High Context)

## MANDATORY RULES

- The problem is already clear — focus is on HOW to solve it, not WHETHER to solve it
- Research what already exists before inventing from scratch
- Explore multiple approaches — minimum 3 distinct ones before converging
- Use creative techniques from `brain-methods.csv` to widen the solution space
- Output is a business-level analysis — feeds directly into the Feature
- Do NOT jump to technical implementation (code, architecture) — stay at business level
- **Persist every answer the moment it is given.** Read `{feature_folder}/sessao.md` on entry, and write each answer into it as soon as the user gives it — never accumulate answers in the conversation and flush them at the end of the step. This step is long (20-40 angles); a session that ends mid-brainstorming must lose nothing. Corollary: never ask a question whose answer is already recorded in `sessao.md` — confirm it instead.
- **Read code silently, speak business.** You MAY read source files and `.makuco/docs/codebase/*` to ground yourself in what already exists (they are a source of truth) — but NEVER surface that technical detail in what you say or write, and never pose technical/implementation questions. No code symbols, functions, routes/endpoints, DTOs/fields, HTTP status codes, file paths, or type shapes in the facilitation or the analysis output. This step may be run by analysis/business people — keep the conversation and artifacts at the capability/business level. Reuse is expressed as **capabilities** ("a note-creation flow and a validation rule already exist and could be reused"), never as code artifacts ("`validateNoteInput`", "`PUT /api/notes/[id]`", "422", "add `updateNote` to the repo"). Technical detail is `makuco-desenvolver`'s job (F3).
- Techniques loaded on demand from `../assets/brain-methods.csv` (via [../references/brainstorming.md](../references/brainstorming.md))

---

## GOAL OF THIS STEP

Understand how to make the problem's solution viable:
1. What the market already proposes as a solution
2. What already exists in this project that could be reused
3. Which approach best balances value, effort, and risk
4. Which business rules, affected dimensions, and use cases are involved

**Target:** 20-40 solution approaches/angles explored before converging on a choice.

---

## SEQUENCE

### 1. Confirm the problem

Read `{feature_folder}/sessao.md` first and check `initial_answers`.

**Already filled** (this step is being resumed, possibly in a brand-new session) — do not repeat the questions. Present what is recorded and ask only for a confirmation:

> "Retomando a análise de **[feature_title]**. Já tenho registrado:
>
> 1. **Problema:** [initial_answers.problema]
> 2. **Principal afetado:** [initial_answers.principal_afetado]
> 3. **Critério de sucesso:** [initial_answers.criterio_sucesso]
> 4. **Restrições:** [initial_answers.restricoes]
>
> **[S]** Confirmar e seguir | **[A]** Ajustar algum item"

**STOP — wait for the decision.** On `[A]`, ask which items change, and rewrite only those keys in `initial_answers` (leave the others exactly as they are).

**Empty** — ask the four questions:

> "Antes de explorar soluções, vamos garantir que o problema está bem articulado:
>
> 1. **Qual é o problema exato?** (em uma frase direta, do ponto de vista de quem é afetado)
> 2. **Quem é o principal afetado?**
> 3. **Qual o critério de sucesso?** (como saberemos que resolvemos quando a solução estiver em produção?)
> 4. **Existe alguma restrição conhecida?** (integrações obrigatórias, escopo de usuários, prazos)"

**STOP — wait for the answers before continuing.**

As soon as the answers arrive — before moving to section 2 — update `sessao.md`:

```yaml
initial_answers:
  problema: '{resposta 1}'
  principal_afetado: '{resposta 2}'
  criterio_sucesso: '{resposta 3}'
  restricoes: '{resposta 4}'
```

Transcribe the answers as the user gave them, in PT-BR — do not rewrite, summarize, or enrich them. This is the faithful record of what was said; the synthesis happens later in section 5. The "read code silently, speak business" rule applies here too: no technical detail enters these fields, even if the user's answer invites it.

Leave `stepsCompleted` at `[1]`. Step 2 has not finished, and that is precisely what makes a resumed session come back to this step instead of skipping ahead.

### 2. Creative technique selection for solution ideation

Check `ideation_technique` in `sessao.md`.

**Already filled** — do not re-ask. State what is in use and move on:

> "Seguindo com a abordagem de ideação já escolhida: [ideation_technique]."

**Empty** — ask:

> "Para ampliar o espaço de soluções antes de convergir, qual abordagem prefere?
>
> **[1] Eu recomendo** — escolho 2-3 técnicas adequadas para ideação de soluções
> **[2] Exploração livre** — conduzimos sem técnica formal, pelas 5 dimensões
> **[3] Técnica específica** — me diga qual técnica do catálogo quer usar"

**STOP — wait for the selection.**

Immediately after the selection, update `sessao.md`:

- `ideation_technique: '{selected mode + the technique names actually chosen}'`

Follow the mode's execution rules in [../references/brainstorming.md](../references/brainstorming.md) (section "Selection modes — SOLUÇÃO").

### 3. Solution exploration

Conduct the brainstorming across these dimensions, using the selected technique(s) as a lens:

**Dimension 1 — What the market already does:**
- How do direct competitors/adjacent tools solve this?
- What patterns exist for this in similar products?

**Dimension 2 — What already exists in this project (capability level only):**
- Does any existing **capability/feature** already partially address this? (e.g. "notes can already be created and listed")
- Is there a **user-facing behavior** elsewhere that could be generalized? (e.g. "the create flow could be generalized to also edit")
- Is there anything in the backlog or in production close to this?

Ground this in `.makuco/docs/codebase/*`, the feature's artifacts, and the source code as needed — but express reuse only at a **capability** level. Naming *what the app can already do* is in scope; citing *how it's coded* (symbols, routes, DTOs, status codes) is not — that's `makuco-desenvolver`'s job.

Start from `OVERVIEW.md` and the `modules/<slug>.md` docs when they exist: they are already written at capability level (`Aprova contratos em lote.`), which is exactly this dimension's language. Use the module map to scope which repos/modules the feature touches, then read only those module docs — do not sweep the folder or dive into the technical files for this.

**Dimension 3 — Solution approaches (minimum 3 distinct):**
- Generate approaches that are genuinely different — not variations of the same idea
- For each: what it delivers, what it doesn't, cost (high/medium/low), risk (high/medium/low)

**Dimension 4 — Use cases and business rules:**
- Which dimensions/areas of the project are affected?
- Are there rules specific to a subset of users/tenants?
- Expected behavior in edge cases?

**Dimension 5 — Value and prioritization:**
- Which approach delivers the most value with the least risk?
- Is there an MVP version that validates the hypothesis before full investment?
- What is explicitly OUT of scope?

**Continue until ~20-40 solution angles are explored OR the user indicates satisfaction.**

### 4. Convergence — choosing the approach

After sufficient exploration:

> "Exploramos [N] ângulos de solução. Vou apresentar as abordagens mais promissoras para você escolher:
>
> **Abordagem A:** [nome] — [o que entrega] | Custo: [alto/médio/baixo] | Risco: [alto/médio/baixo]
> **Abordagem B:** [nome] — [o que entrega] | Custo: [alto/médio/baixo] | Risco: [alto/médio/baixo]
> **Abordagem C:** [nome] — [o que entrega] | Custo: [alto/médio/baixo] | Risco: [alto/médio/baixo]
>
> Qual você escolhe? (ou podemos combinar elementos)"

**STOP — wait for the choice before continuing.**

### 5. Synthesize the analysis

Consolidate into `sessao.md` (`brainstorming_notes`):
- Chosen approach and why
- What was discarded and why
- Business rules mapped
- Affected dimensions
- Identified constraints
- Techniques used

### 6. Update frontmatter

Update `sessao.md`:
- `stepsCompleted: [1, 2]`
- `brainstorming_notes: '{summary of the chosen approach and main decisions}'`
- `validation_approved: true` (SOLUÇÃO mode never goes through the product gate)

This updates the fields named above and nothing else. `status` stays `analyzing` — only
`step-06-fechamento` ends the analysis in SOLUÇÃO mode (there is no gate step here to reject it).

`initial_answers` and `ideation_technique` were already written in sections 1 and 2 — this section only appends the three fields above and must not rewrite or reword either of them.

### 7. Advance to Feature documentation

> "Análise de solução concluída. Tenho um entendimento claro da abordagem, regras de negócio e dimensões envolvidas.
> Vamos documentar a Feature formalmente. **[S]** Continuar"

**STOP — wait for confirmation.**

Load `./step-04-feature.md` (SOLUÇÃO routes directly here — it never loads `step-03-gate.md`).

---

## SUCCESS METRICS

- Problem articulated clearly before exploring solutions
- The four answers persisted to `initial_answers` and the choice to `ideation_technique` **before** the exploration starts — a session ending mid-brainstorming loses nothing
- A resumed session confirms the recorded answers instead of asking them again
- Technique(s) from `brain-methods.csv` applied
- Minimum 3 distinct approaches explored, 20-40 angles total
- Chosen approach with clear justification
- Business rules and affected dimensions mapped
- `sessao.md` updated: `stepsCompleted: [1, 2]`, `validation_approved: true`
