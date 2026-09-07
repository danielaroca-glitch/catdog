import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // Primitivas geradas pelo shadcn/ui (via `npx shadcn add`) — não são código de
  // negócio próprio, excluídas da métrica de cobertura por convenção do projeto.
  coveragePathIgnorePatterns: ["/node_modules/", "<rootDir>/src/components/ui/"],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)
