const fs = require("fs")

// Remove unused duplicate keys from common.json that are now in settings.json
const languages = ["en", "ko", "ja", "zh"]

const keysToRemove = [
	"doesNotSupportBrowserUse", // duplicate of settings modelInfoView.doesNotSupportBrowser
	"doesNotSupportPromptCaching", // duplicate of settings modelInfoView.doesNotSupportCache
]

console.log("🧹 Removing unused duplicate keys from common.json files...\n")

languages.forEach((lang) => {
	const commonPath = `webview-ui/src/caret/locale/${lang}/common.json`

	console.log(`🔄 Processing ${lang}...`)

	const data = JSON.parse(fs.readFileSync(commonPath, "utf8"))

	// Remove keys from the common section
	if (data.common) {
		keysToRemove.forEach((key) => {
			if (data.common[key]) {
				const value = data.common[key]
				console.log(`  🧹 Removing unused key common.${key}: "${value}"`)
				delete data.common[key]
			}
		})
	}

	// Write back file
	fs.writeFileSync(commonPath, JSON.stringify(data, null, "\t") + "\n")
})

console.log("\n✅ Unused duplicate keys removed from common.json files!")
console.log("📋 All doesNotSupport keys are now unified in settings.json modelInfoView section.")
