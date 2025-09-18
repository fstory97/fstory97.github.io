# Repository Guidelines

## Project Structure & Module Organization
The VS Code extension code lives in src/, with domain modules under core/, services/, hosts/, and generated API clients under generated/. Tests for the extension sit in src/test, including Playwright-ready specs in src/test/e2e. The web client rendered in the sidebar is isolated in webview-ui/ (Vite + TypeScript), with shared assets in ssets/ and docs in docs/ and caret-docs/. Reusable build scripts and codegen utilities are under caret-scripts/ and scripts/.

## Build, Test, and Development Commands

pm run compile performs type-checking, linting, and bundles the extension with esbuild. 
pm run watch runs TypeScript and esbuild watchers for rapid iteration. Use 
pm run dev:webview inside webview-ui/ to iterate on the sidebar UI, and 
pm run build:webview before packaging. 
pm run protos regenerates gRPC and shared types; follow it with 
pm run compile after changing files in proto/. 
pm run test aggregates unit and integration suites, while 
pm run e2e drives Playwright end-to-end runs.

## Coding Style & Naming Conventions
Biome enforces formatting: tabs with width 4, trailing commas where valid, and sorted imports. Prefer camelCase for variables/functions, PascalCase for classes and React components, and UPPER_SNAKE_CASE for shared constants. Keep modules small, colocating helpers in src/utils or webview-ui/src/lib. Run 
pm run lint and 
pm run format:fix before pushing; the Husky pre-commit hook repeats these checks on staged files.

## Testing Guidelines
Unit tests use Vitest (*.test.ts) in both src/ and webview-ui/src/. Integration suites run through scode-test; ¡°slow¡± cases belong in src/test/e2e alongside any Playwright flows. Capture new behaviors with focused unit tests, then confirm coverage with 
pm run test:coverage or webview-ui npm run test:coverage. Ensure Playwright specs leave the workspace clean and leverage mock credentials from src/test/e2e/utils.

## Commit & Pull Request Guidelines
Follow Conventional Commits (eat:, ix:, docs:, chore:) as in recent history; scope optional but encouraged (e.g., eat(extension): add MCP registry cache). Reference GitHub issues with #123 when applicable and keep messages under 72 characters. PRs should summarize intent, list validation commands, and include screenshots or recordings for UI changes. Confirm lint, type-check, and relevant tests locally before requesting review.

## Localization & Generated Assets
When touching translation keys under locales/ or webview-ui/src/i18n, run 
pm run sync:i18n-keys to reconcile namespaces. Never hand-edit files in src/generated/; regenerate via 
pm run protos and commit the output together with the source changes.
