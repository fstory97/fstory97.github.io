const fs = require("fs")

// Remove duplicate keys from common.json since they're now in settings.json under modelInfoView
const languages = ["en", "ko", "ja", "zh"]

const duplicateKeysToRemove = [
	"doesNotSupportBrowserUse", // duplicate of settings modelInfoView.doesNotSupportBrowser
	"doesNotSupportPromptCaching", // duplicate of settings modelInfoView.doesNotSupportCache
]

console.log("🧹 Removing duplicate keys from common.json files...\n")

languages.forEach((lang) => {
	const commonPath = `webview-ui/src/caret/locale/${lang}/common.json`

	console.log(`🔄 Processing ${lang}...`)

	const common = JSON.parse(fs.readFileSync(commonPath, "utf8"))

	if (common.common) {
		duplicateKeysToRemove.forEach((key) => {
			if (common.common[key]) {
				const value = common.common[key]
				console.log(`  🧹 Removing duplicate key common.${key}: "${value}"`)
				delete common.common[key]
			}
		})
	}

	// Write back file
	fs.writeFileSync(commonPath, JSON.stringify(common, null, "\t") + "\n")
})

console.log("\n✅ Duplicate keys removed from common.json files!")
console.log("📋 All doesNotSupport keys are now consolidated in settings.json under modelInfoView section.")
