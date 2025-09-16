import { expect } from "@playwright/test"
import { addSelectedCodeToClineWebview, getClineEditorWebviewFrame, openTab, toggleNotifications } from "./utils/common"
import { e2e } from "./utils/helpers"

e2e("code actions and editor panel", async ({ page, sidebar, helper }) => {
	const freeButton = sidebar.getByRole("button", { name: /Start for Free|Get Started for Free/ })
	await freeButton.click({ delay: 100 })
	// Sidebar - input should start empty
	const sidebarInput = sidebar.getByTestId("chat-input")
	await sidebarInput.click()
	await toggleNotifications(page)
	await expect(sidebarInput).toBeEmpty()

	// Open file tree and select code from file
	await openTab(page, "Explorer ")
	await page.getByRole("treeitem", { name: "index.html" }).locator("a").click()
	await expect(sidebarInput).not.toBeFocused()

	// Sidebar should be opened and visible after adding code to Caret/Cline
	await addSelectedCodeToClineWebview(page)
	await expect(sidebarInput).not.toBeEmpty()
	await expect(sidebarInput).toBeFocused()

	await page.getByRole("button", { name: "Open in Editor" }).click()
	await page.waitForLoadState("load")
	const editorTab = page.getByRole("tab", { name: /(Caret|Cline), Editor Group/ })
	await expect(editorTab).toBeVisible()

	// Editor Panel
	const editorWebview = await getClineEditorWebviewFrame(page)

	await editorWebview.getByTestId("chat-input").click()
	await expect(editorWebview.getByTestId("chat-input")).toBeEmpty()
	await addSelectedCodeToClineWebview(page)
	await expect(editorWebview.getByTestId("chat-input")).not.toBeEmpty()
})
