const fs = require("fs")

// Complete translations for Korean (including missing "supports" translations)
const koreanTranslations = {
	// Settings.json modelInfoView section
	supportsBrowser: "브라우저 사용 지원",
	supportsCache: "프롬프트 캐싱 지원",
	supportsCacheLabel: "프롬프트 캐싱 지원:",
	supportsImagesLabel: "이미지 지원:",
	supportsComputerUseLabel: "컴퓨터 사용 지원:",
}

const languages = ["en", "ko", "ja", "zh"]

console.log("🧹 Final cleanup of doesNotSupport keys...\n")

languages.forEach((lang) => {
	const commonPath = `webview-ui/src/caret/locale/${lang}/common.json`
	const settingsPath = `webview-ui/src/caret/locale/${lang}/settings.json`

	console.log(`🔄 Processing ${lang}...`)

	// Read files
	const common = JSON.parse(fs.readFileSync(commonPath, "utf8"))
	const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"))

	// Fix Korean hardcoded English values in settings
	if (lang === "ko" && settings.modelInfoView) {
		Object.keys(koreanTranslations).forEach((key) => {
			if (settings.modelInfoView[key]) {
				const oldValue = settings.modelInfoView[key]
				const newValue = koreanTranslations[key]
				if (oldValue !== newValue) {
					console.log(`  📝 Fixing ${key}: "${oldValue}" → "${newValue}"`)
					settings.modelInfoView[key] = newValue
				}
			}
		})
	}

	// Remove duplicate keys from common.json (since they're now in settings.json)
	const duplicateKeys = [
		"doesNotSupportBrowserUse", // duplicate of settings doesNotSupportBrowser
		"doesNotSupportPromptCaching", // duplicate of settings doesNotSupportCache
	]

	if (common.common) {
		duplicateKeys.forEach((key) => {
			if (common.common[key]) {
				console.log(`  🧹 Removing duplicate key common.${key}: "${common.common[key]}"`)
				delete common.common[key]
			}
		})
	}

	// Write back files
	fs.writeFileSync(commonPath, JSON.stringify(common, null, "\t") + "\n")
	fs.writeFileSync(settingsPath, JSON.stringify(settings, null, "\t") + "\n")
})

console.log("\n✅ Final cleanup complete!")
console.log("📋 Summary:")
console.log("   • Fixed Korean hardcoded English values in settings.json")
console.log("   • Removed duplicate keys from common.json")
console.log("   • All doesNotSupport/supports keys now consolidated in settings.json under modelInfoView")
