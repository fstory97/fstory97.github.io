import * as vscode from "vscode"
import { VscodeWebviewProvider } from "@/hosts/vscode/VscodeWebviewProvider"
import { Logger } from "@/services/logging/Logger"
import { Controller } from "@/core/controller/index"
import { getUri } from "@caret/utils/getUri"
import * as fs from "fs/promises"
import { existsSync } from "fs"
import * as path from "path"

/**
 * CaretProviderWrapper - Wrapper Pattern Implementation
 *
 * This class wraps the original Cline VscodeWebviewProvider to inject Caret-specific
 * functionality while maintaining full compatibility with the Cline initialization flow.
 *
 * Key Design Principles:
 * - Minimal modification to Cline source code
 * - Full compatibility with Cline's initialization sequence
 * - Proper separation of concerns between Caret and Cline features
 * - Maintainability for future upstream merges
 */
export class CaretProviderWrapper implements vscode.WebviewViewProvider {
	private clineProvider: VscodeWebviewProvider
	private disposables: vscode.Disposable[] = []
	private _onDidReceiveMessage = new vscode.EventEmitter<any>()
	public readonly onMessage = this._onDidReceiveMessage.event
	private _onDidResolveWebviewView = new vscode.EventEmitter<vscode.WebviewView>()
	public readonly onWebviewViewResolved = this._onDidResolveWebviewView.event

	constructor(
		private context: vscode.ExtensionContext,
		clineWebviewProvider: VscodeWebviewProvider,
	) {
		this.clineProvider = clineWebviewProvider
		Logger.info("[CaretProviderWrapper] Initialized with Cline WebviewProvider")
	}

	/**
	 * Implements the VS Code WebviewViewProvider interface
	 * Delegates to the Cline provider while adding Caret enhancements
	 */
	async resolveWebviewView(webviewView: vscode.WebviewView) {
		Logger.info("[CaretProviderWrapper] Resolving webview view with Caret enhancements")

		try {
			// Emit our own resolve event
			this._onDidResolveWebviewView.fire(webviewView)

			// 1. First, let Cline handle the core webview setup
			await this.clineProvider.resolveWebviewView(webviewView)

			// 2. Then add Caret-specific enhancements
			await this.enhanceWebviewWithCaretFeatures(webviewView)

			// 3. Set up Caret-specific message handling
			this.setupCaretMessageHandling(webviewView)

			Logger.info("[CaretProviderWrapper] Successfully resolved webview with Caret features")
		} catch (error) {
			Logger.error(`[CaretProviderWrapper] Failed to resolve webview: ${error}`)
			throw error
		}
	}

	/**
	 * Enhance the webview with Caret-specific features
	 * Following caret-main pattern: inject Base64 images as window variables
	 */
	public async enhanceWebviewWithCaretFeatures(webviewView: vscode.WebviewView): Promise<void> {
		try {
			// Enhance webview options for Caret-specific resources
			const originalOptions = webviewView.webview.options
			webviewView.webview.options = {
				...originalOptions,
				localResourceRoots: [
					...(originalOptions.localResourceRoots || []),
					vscode.Uri.joinPath(this.context.extensionUri, "assets"),
				],
			}

			// Inject template character images and banner as Base64 data URIs following caret-main pattern
			await this.injectTemplateImagesAsBase64(webviewView)
			await this.injectBannerImageAsBase64(webviewView)

			Logger.info("[CaretProviderWrapper] Webview enhanced with Caret features - template images injected as Base64")
		} catch (error) {
			Logger.warn(`[CaretProviderWrapper] Failed to enhance webview: ${error}`)
		}
	}

	/**
	 * Inject template character images as Base64 data URIs following caret-main pattern
	 * This follows the exact pattern from caret-main/caret-src/core/webview/CaretProvider.ts
	 */
	private async injectTemplateImagesAsBase64(webviewView: vscode.WebviewView): Promise<void> {
		try {
			let html = webviewView.webview.html
			Logger.debug(`[CaretProviderWrapper] Starting HTML injection. Original length: ${html.length}`)

			// Part 1: Inject all template character images (e.g., for the selector UI)
			const templateDir = path.join(this.context.extensionUri.fsPath, "assets", "template_characters")
			const allFiles = await fs.readdir(templateDir)
			const imageFiles = allFiles.filter((file) => file.endsWith(".png"))
			
			let templateInjectionScript = "\n"
			for (const file of imageFiles) {
				try {
					const imagePath = path.join(templateDir, file)
					const imageBuffer = await fs.readFile(imagePath)
					const base64 = imageBuffer.toString("base64")
					const dataUri = `data:image/png;base64,${base64}`
					const varName = file.replace(".png", "").replace("_", "")
					templateInjectionScript += `window.templateImage_${varName} = "${dataUri}";\n`
				} catch (error) {
					Logger.error(`[CaretProviderWrapper] Failed to load template image ${file}: ${error}`)
				}
			}

			// Part 2: Determine and inject the ACTIVE persona images (from storage or default)
			let profileBase64: string | null = null
			let thinkingBase64: string | null = null

			const personaDir = path.join(this.context.globalStorageUri.fsPath, "personas")
			const profilePath = path.join(personaDir, "agent_profile.png")
			const thinkingPath = path.join(personaDir, "agent_thinking.png")

			if (existsSync(profilePath) && existsSync(thinkingPath)) {
				try {
					const profileBuffer = await fs.readFile(profilePath)
					thinkingBase64 = (await fs.readFile(thinkingPath)).toString("base64")
					profileBase64 = profileBuffer.toString("base64")
					Logger.info("[CaretProviderWrapper] Successfully loaded persona images from globalStorage.")
				} catch (error) {
					Logger.error(`[CaretProviderWrapper] Failed to read persona images from globalStorage, falling back to default: ${error}`)
				}
			}

			if (!profileBase64 || !thinkingBase64) {
				try {
					Logger.info("[CaretProviderWrapper] Loading default Caret persona images as fallback.")
					const caretProfilePath = path.join(templateDir, "caret.png")
					const caretThinkingPath = path.join(templateDir, "caret_thinking.png")
					profileBase64 = (await fs.readFile(caretProfilePath)).toString("base64")
					thinkingBase64 = (await fs.readFile(caretThinkingPath)).toString("base64")
				} catch (error) {
					Logger.error(`[CaretProviderWrapper] CRITICAL: Failed to load default Caret images: ${error}`)
				}
			}

			let personaInjectionScript = "\n"
			if (profileBase64) {
				personaInjectionScript += `window.personaProfile = "data:image/png;base64,${profileBase64}";\n`
			}
			if (thinkingBase64) {
				personaInjectionScript += `window.personaThinking = "data:image/png;base64,${thinkingBase64}";\n`
			}

			// Part 3: Inject all scripts into the HTML
			const finalInjectionScript = templateInjectionScript + personaInjectionScript
			if (html.includes("window.clineClientId")) {
				html = html.replace(/(window\.clineClientId = "[^"]*";)/, `$1${finalInjectionScript}`)
			} else if (html.includes("</head>")) {
				html = html.replace("</head>", `<script>${finalInjectionScript}</script></head>`)
			}

			webviewView.webview.html = html
			Logger.info(`[CaretProviderWrapper] Image injection complete. New HTML length: ${html.length}`)
		} catch (error) {
			Logger.error(`[CaretProviderWrapper] Failed to inject template images: ${error}`)
		}
	}

	/**
	 * Set up Caret-specific message handling
	 */
	private setupCaretMessageHandling(webviewView: vscode.WebviewView): void {
		const messageDisposable = webviewView.webview.onDidReceiveMessage(async (message) => {
			// CARET MODIFICATION: Suppress noisy getBrowserConnectionInfo logs
			if (!(message.type === "grpc_request" && message.grpc_request?.method === "getBrowserConnectionInfo")) {
				Logger.debug(`[CaretProviderWrapper] Received message: ${JSON.stringify(message)}`)
			}

			// Fire our own event
			this._onDidReceiveMessage.fire(message)
			try {
				await this.handleCaretMessage(message, webviewView)
			} catch (error) {
				Logger.error(`[CaretProviderWrapper] Error handling Caret message: ${error}`)
			}
		})

		this.disposables.push(messageDisposable)
	}

	/**
	 * Handle Caret-specific messages
	 */
	private async handleCaretMessage(message: any, webviewView: vscode.WebviewView): Promise<void> {
		// CARET MODIFICATION: Suppress noisy grpc_request logs
		if (message.type !== "grpc_request") {
			Logger.debug(`[CaretProviderWrapper] Processing message type: ${message.type}`)
		}
		switch (message.type) {
			case "caret_load_persona_image":
				await this.handleLoadPersonaImage(message, webviewView)
				break
			default:
				// CARET MODIFICATION: Suppress noisy grpc_request logs
				if (message.type !== "grpc_request") {
					Logger.debug(`[CaretProviderWrapper] Passing message to Cline: ${message.type}`)
				}
				// Let Cline handle non-Caret messages
				break
		}
	}


	/**
	 * Handle persona image loading requests
	 */
	private async handleLoadPersonaImage(message: any, webviewView: vscode.WebviewView): Promise<void> {
		try {
			const { personaId, imagePath } = message
			const fullPath = path.join(this.context.extensionUri.fsPath, "assets", "template_characters", imagePath)

			if (existsSync(fullPath)) {
				const imageUri = getUri(webviewView.webview, this.context.extensionUri, [
					"assets",
					"template_characters",
					imagePath,
				])

				webviewView.webview.postMessage({
					type: "caret_persona_image_loaded",
					personaId,
					imageUri: imageUri.toString(),
				})
			} else {
				Logger.warn(`[CaretProviderWrapper] Persona image not found: ${fullPath}`)
			}
		} catch (error) {
			Logger.error(`[CaretProviderWrapper] Failed to load persona image: ${error}`)
		}
	}

	/**
	 * Inject banner image as Base64 data URI
	 */
	private async injectBannerImageAsBase64(webviewView: vscode.WebviewView): Promise<void> {
		try {
			const bannerPath = path.join(this.context.extensionUri.fsPath, "assets", "welcome-banner.webp")
			if (existsSync(bannerPath)) {
				const imageBuffer = await fs.readFile(bannerPath)
				const base64 = imageBuffer.toString("base64")
				const dataUri = `data:image/webp;base64,${base64}`

				let html = webviewView.webview.html

				// Inject banner image as window variable
				let imageInjectionScript = `\n                    window.caretBannerImage = "${dataUri}";\n`

				// Find where to inject the script - look for existing window assignments
				if (html.includes("window.clineClientId")) {
					// Inject right after existing window assignments
					html = html.replace(/(window\.clineClientId = "[^"]*";)/, `$1${imageInjectionScript}`)
				} else if (html.includes("</head>")) {
					// Fallback: inject in head
					const scriptTag = `<script>${imageInjectionScript}</script>`
					html = html.replace("</head>", `${scriptTag}</head>`)
				}

				webviewView.webview.html = html
				Logger.info(`[CaretProviderWrapper] Banner image injected successfully (${imageBuffer.length} bytes)`)
			}
		} catch (error) {
			Logger.error(`[CaretProviderWrapper] Failed to inject banner image: ${error}`)
		}
	}

	/**
	 * Convert asset:// URI to Base64 data URI (following file-storage-and-image-loading-guide.mdx)
	 */
	private async convertImageToBase64(assetUri: string): Promise<string> {
		if (!assetUri.startsWith("asset://") && !assetUri.startsWith("asset:/")) {
			return assetUri
		}

		try {
			// Parse asset path - now JSON uses "asset:/assets/template_characters/..."
			let cleanPath = assetUri.replace("asset://", "").replace("asset:/", "")

			const imagePath = path.join(this.context.extensionUri.fsPath, cleanPath)

			// Read and convert to Base64
			const imageBuffer = await fs.readFile(imagePath)
			const ext = path.extname(imagePath).toLowerCase()
			const mimeType =
				ext === ".png"
					? "image/png"
					: ext === ".jpg" || ext === ".jpeg"
						? "image/jpeg"
						: ext === ".webp"
							? "image/webp"
							: "image/png"

			const base64Uri = `data:${mimeType};base64,${imageBuffer.toString("base64")}`
			Logger.info(
				`[CaretProviderWrapper] Converted image: ${assetUri} -> data:${mimeType};base64,<${imageBuffer.length} bytes>`,
			)

			return base64Uri
		} catch (error) {
			Logger.error(`[CaretProviderWrapper] Failed to convert image URI: ${assetUri}`, error)
			return assetUri // Return original URI as fallback
		}
	}

	/**
	 * Get the underlying Cline controller
	 */
	public get controller(): Controller {
		return this.clineProvider.controller
	}

	/**
	 * Get the webview instance
	 */
	public getWebview(): vscode.Webview | undefined {
		const webviewInstance = this.clineProvider.getWebview()
		// Handle different webview types returned by Cline provider
		if (!webviewInstance) {
			return undefined
		}

		// If it's a WebviewView, return its webview property
		if ("webview" in webviewInstance) {
			return (webviewInstance as vscode.WebviewView).webview
		}

		// If it's already a Webview, return it directly
		return webviewInstance as vscode.Webview
	}

	/**
	 * Get the client ID
	 */
	public getClientId(): string {
		return this.clineProvider.getClientId()
	}

	/**
	 * Dispose of resources
	 */
	async dispose(): Promise<void> {
		// Dispose Caret-specific resources
		this.disposables.forEach((disposable) => disposable.dispose())
		this.disposables = []

		// Delegate to Cline provider
		await this.clineProvider.dispose()

		Logger.info("[CaretProviderWrapper] Disposed successfully")
	}
}
