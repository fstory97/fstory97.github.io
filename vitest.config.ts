import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		environment: "node",
		mockReset: true,
		setupFiles: ["./vitest.setup.ts"],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/cypress/**",
			"**/.{idea,git,cache,output,temp}/**",
			"**/caret-b2b/**/*.test.js",
			"**/caret-scripts/**/*.test.js",
			"**/webview-ui/src/**/*.spec.tsx",
			"**/webview-ui/src/**/*integration.test.tsx",
			"**/caret-src/__tests__/**/*.test.ts",
		],
		deps: {
			// CARET MODIFICATION: Removed external vscode dependency as it is now fully mocked in tests
		},
	},
})
