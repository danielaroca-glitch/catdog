# Brainstorming — Anti-Bias Protocol & Selection Modes

Shared reference used by `step-02a-descoberta.md` (DESCOBERTA) and `step-02b-solucao.md` (SOLUÇÃO). Techniques live in `../assets/brain-methods.csv` (61 techniques, 10 categories) and are loaded **on demand** — read the CSV only when a technique needs to be presented or executed, never preload it wholesale into the conversation.

## Categories in `brain-methods.csv`

| Category | Focus |
| --- | --- |
| `collaborative` | Building together, role playing, relay race |
| `creative` | What-if, analogies, inversion, first principles |
| `deep` | Five whys, morphological analysis, constraint mapping |
| `introspective_delight` | Inner child, values, future wisdom |
| `structured` | SCAMPER, Six Hats, mind mapping, solution matrix |
| `theatrical` | Time machine, alien anthropologist, universe fusion |
| `wild` | Chaos engineering, pirate code, quantum superposition |
| `biomimetic` | Nature's solutions, ecosystems, evolutionary pressure |
| `quantum` | Observer effect, entanglement, superposition collapse |
| `cultural` | Indigenous wisdom, cultural fusion, mythic frameworks |

## Selection modes — DESCOBERTA (4 modes)

Presented to the user at the start of the brainstorming session:

1. **Usuário escolhe** — read `brain-methods.csv`, present the 10 categories, let the user pick a category then a technique.
2. **IA recomenda** — pick 3 techniques from the CSV suited to exploring a vague opportunity. Prioritize: 1 `deep` (e.g. Cinco Porquês, Mapeamento de Restrições) + 1 `creative` (e.g. Cenários E Se, Reversão/Inversão) + 1 `wild` (to break pattern-matching).
3. **Aleatória** — read the CSV, pick 1 random technique (vary category each round). Offer a new random technique once the current one is exhausted.
4. **Fluxo progressivo** — run techniques in this fixed order:
   1. Divergente amplo (`creative` or `wild`) — no constraints
   2. Aprofundamento (`deep`) — drill into the most promising hypotheses
   3. Estruturação (`structured`) — organize what emerged
   4. Validação (`deep` → Análise de Falhas or Mapeamento de Restrições)

## Selection modes — SOLUÇÃO (3-mode variant)

Solution mode skips "aleatória" (already high-context, don't want pure randomness) and offers:

1. **IA recomenda** — 2-3 techniques focused on solution generation. Prioritize `structured` (SCAMPER, Polinização Cruzada, Matriz de Soluções) for systematic solutions, `creative` (Pensamento Analógico, Pensamento de Primeiros Princípios, Relações Forçadas) for innovative angles, and optionally one `biomimetic`/`cultural` technique for a less obvious perspective.
2. **Exploração livre** — no formal technique, guided by the 5 solution dimensions (see step-02b).
3. **Técnica específica** — read the CSV, present techniques by category, let the user pick.

## Anti-bias protocol

LLMs tend toward semantic clustering — ideas drift into the same lane after a few rounds. Every **~10 ideas/angles**, consciously rotate the creative domain being explored:

**Generic rotation axis (reusable as-is):** técnico → experiência do usuário (UX) → viabilidade de negócio → casos extremos (edge cases) → mercado.

**Persona axis (project-specific — do NOT hardcode):** who is affected rotates through the personas defined in `MAKUCO.md` / `makuco-product-context` for this project (e.g. "cliente → operador → time interno" or whatever roles the project's config defines). If no personas are configured, ask the user for the minimal vocabulary before starting (see step-01 config resolution) — never default to a fixed persona set from another domain.

After every ~10 ideas, ask the user: "Quer continuar explorando este ângulo ou mudar para uma nova dimensão/técnica?"

## Loading `brain-methods.csv` on demand

- Do not read the full CSV at skill load time — only when a step needs to present categories/techniques to the user or pick one.
- When presenting a category, filter the CSV rows by `category` and show `technique_name` + `description`.
- When executing a technique, follow its `description` field as the facilitation guide, applied to the actual problem/opportunity being discussed — never to a placeholder domain.
