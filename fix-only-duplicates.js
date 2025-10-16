const fs = require("fs")

const languages = ["en", "ko", "ja", "zh"]

console.log("🔧 Fixing only actual duplicates (keeping openrouter and litellm)...\n")

languages.forEach((lang) => {
	const settingsPath = `webview-ui/src/caret/locale/${lang}/settings.json`

	console.log(`🔄 Processing ${lang}...`)

	const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"))

	if (!settings.providers) {
		console.log(`  ⚠️ No providers section found in ${lang}`)
		return
	}

	let hasChanges = false

	// 1. Merge claudeCode → claude-code (keep more complete data)
	if (settings.providers.claudeCode && settings.providers["claude-code"]) {
		console.log(`  🔧 Merging claudeCode → claude-code`)

		// Add missing keys from camelCase version to kebab version
		Object.keys(settings.providers.claudeCode).forEach((key) => {
			if (!settings.providers["claude-code"][key]) {
				console.log(`    📥 Adding missing key claude-code.${key}: "${settings.providers.claudeCode[key]}"`)
				settings.providers["claude-code"][key] = settings.providers.claudeCode[key]
			}
		})

		// Remove camelCase version
		console.log(`    🗑️ Removing duplicate camelCase key: claudeCode`)
		delete settings.providers.claudeCode
		hasChanges = true
	} else if (settings.providers.claudeCode && !settings.providers["claude-code"]) {
		console.log(`  🔄 Renaming claudeCode → claude-code`)
		settings.providers["claude-code"] = settings.providers.claudeCode
		delete settings.providers.claudeCode
		hasChanges = true
	}

	// 2. Rename sapaicore → sap-ai-core
	if (settings.providers.sapaicore) {
		console.log(`  🔄 Renaming sapaicore → sap-ai-core`)
		settings.providers["sap-ai-core"] = settings.providers.sapaicore
		delete settings.providers.sapaicore
		hasChanges = true
	}

	// Write back only if there were changes
	if (hasChanges) {
		fs.writeFileSync(settingsPath, JSON.stringify(settings, null, "\t") + "\n")
	} else {
		console.log(`  ✅ No changes needed`)
	}
})

console.log("\n✅ Duplicate cleanup complete (openrouter and litellm preserved)!")
console.log("📋 Summary:")
console.log("   • Merged claudeCode → claude-code (preserved all data)")
console.log("   • Renamed sapaicore → sap-ai-core")
console.log("   • Kept openrouter and litellm intact")
