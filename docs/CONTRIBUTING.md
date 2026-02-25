# Contributing

Thank you for your interest in contributing to VibeQuant!

## Development Setup

```bash
git clone https://github.com/simonpierreboucher02/vquant.git
cd vquant
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

## Before Submitting a PR

Run all checks:

```bash
npm run typecheck     # TypeScript (15 pre-existing errors, do not add new ones)
npm run lint          # ESLint (0 errors, warnings are OK)
npm test              # Vitest (all 41 tests must pass)
npm run build         # Production build must succeed
```

## Code Conventions

| Rule | Details |
|------|---------|
| **TypeScript strict** | `strict: true` in tsconfig.json |
| **ESLint** | Flat config in `eslint.config.js` |
| **Prettier** | Config in `.prettierrc` (double quotes, semicolons, trailing commas) |
| **No `console.log`** | Use `logger` from `server/utils/logger.ts` on server-side |
| **No `any`** | Use proper types. `any` triggers ESLint warning |
| **Zod validation** | All API inputs validated in `server/routes/validation.ts` |
| **Path aliases** | `@/` for client, `@shared/` for shared types |
| **Component files** | One component per file, PascalCase export |
| **Hook files** | `useXxx.ts` naming, camelCase |

## Project Structure

- **Client components** go in `client/src/components/chat/` (chat-specific) or `client/src/components/` (shared)
- **Route handlers** go in `server/routes/` as separate modules
- **Services** go in `server/services/`
- **Shared types** go in `shared/types.ts`
- **Tests** are co-located: `foo.ts` -> `foo.test.ts`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new FMP endpoint for crypto analysis
fix: correct staleTime in queryClient
refactor: extract useChatSession hook
chore: update ESLint config
test: add validation schema tests
docs: update API reference
ci: fix Node version matrix
```

## Adding a New API Endpoint

1. Define the Zod schema in `server/routes/validation.ts`
2. Add the route handler in the appropriate `server/routes/*.ts` module
3. Use `logger` instead of `console.log`
4. Add a test for the validation schema
5. Document the endpoint in `docs/API_REFERENCE.md`

## Adding a New Claude Tool

1. Add the tool definition in `server/services/claude/toolDefinitions.ts`
2. Add the handler in `server/routes.ts` inside `processClaudeResponse`
3. If it produces visual output, handle the SSE event in `client/src/hooks/useChatSession.ts`

## Questions?

Open an issue on [GitHub](https://github.com/simonpierreboucher02/vquant/issues).
