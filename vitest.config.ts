import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		environment: "node",
		mockReset: true,
		setupFiles: ["./vitest.setup.ts"],
		deps: {
			// CARET MODIFICATION: Removed external vscode dependency as it is now fully mocked in tests
		},
	},
})
