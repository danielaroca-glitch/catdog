"use client"

import { useRefreshScheduler } from "@/lib/auth/refresh-scheduler"

/**
 * Componente "headless" (achado #2 do review da pbi-002): a única
 * responsabilidade dele é montar `useRefreshScheduler()` dentro da árvore
 * real da aplicação. Antes desta correção, o hook só era exercitado em
 * `refresh-scheduler.test.ts` (via `renderHook`) — nenhum componente
 * montado em produção o chamava, então a renovação automática de sessão
 * nunca rodava fora de teste.
 *
 * Monte uma única vez, dentro de `SessionProvider` (ver `app/layout.tsx`),
 * perto da raiz da aplicação.
 */
export function SessionRefresher() {
  useRefreshScheduler()
  return null
}
