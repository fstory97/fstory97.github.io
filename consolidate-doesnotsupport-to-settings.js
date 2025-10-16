const fs = require("fs")

// Define standard key mapping - everything goes to settings.json under modelInfoView
const keyMappings = {
	// Keys to keep in settings.json (under modelInfoView section)
	doesNotSupportImages: "doesNotSupportImages",
	doesNotSupportBrowser: "doesNotSupportBrowser",
	doesNotSupportCache: "doesNotSupportCache",
	doesNotSupportImagesLabel: "doesNotSupportImagesLabel",
	doesNotSupportComputerUseLabel: "doesNotSupportComputerUseLabel",
	doesNotSupportCacheLabel: "doesNotSupportCacheLabel",
}

// Define proper translations for Korean
const translations = {
	ko: {
		doesNotSupportImages: "이미지 미지원",
		doesNotSupportBrowser: "브라우저 사용 미지원",
		doesNotSupportCache: "프롬프트 캐싱 미지원",
		doesNotSupportImagesLabel: "이미지 미지원:",
		doesNotSupportComputerUseLabel: "컴퓨터 사용 미지원:",
		doesNotSupportCacheLabel: "프롬프트 캐싱 미지원:",
	},
}

const languages = ["en", "ko", "ja", "zh"]

languages.forEach((lang) => {
	const commonPath = `webview-ui/src/caret/locale/${lang}/common.json`
	const settingsPath = `webview-ui/src/caret/locale/${lang}/settings.json`

	console.log(`🔄 Processing ${lang}...`)

	// Read files
	const common = JSON.parse(fs.readFileSync(commonPath, "utf8"))
	const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"))

	// Ensure modelInfoView section exists in settings
	if (!settings.modelInfoView) {
		settings.modelInfoView = {}
	}

	// Copy/update keys to settings.json under modelInfoView
	Object.keys(keyMappings).forEach((key) => {
		let value = null

		// Priority: specific translation > settings.json > common.json > providers
		if (translations[lang] && translations[lang][key]) {
			value = translations[lang][key]
			console.log(`  📝 Using Korean translation for ${key}: "${value}"`)
		} else if (settings.modelInfoView && settings.modelInfoView[key]) {
			value = settings.modelInfoView[key]
			console.log(`  ✅ Already exists in modelInfoView.${key}`)
		} else if (settings.providers && settings.providers[key]) {
			value = settings.providers[key]
			console.log(`  📦 Moving from providers.${key} to modelInfoView.${key}: "${value}"`)
		} else if (common.common && common.common[key]) {
			value = common.common[key]
			console.log(`  📥 Moving from common.${key} to modelInfoView.${key}: "${value}"`)
		}

		if (value) {
			settings.modelInfoView[key] = value
		}
	})

	// Clean up duplicate keys from other sections
	const keysToRemove = Object.keys(keyMappings)

	// Remove from common.json
	if (common.common) {
		keysToRemove.forEach((key) => {
			if (common.common[key]) {
				console.log(`  🧹 Removing common.${key}`)
				delete common.common[key]
			}
		})
	}

	// Remove from settings providers section
	if (settings.providers) {
		keysToRemove.forEach((key) => {
			if (settings.providers[key]) {
				console.log(`  🧹 Removing providers.${key}`)
				delete settings.providers[key]
			}
		})
	}

	// Write back files
	fs.writeFileSync(commonPath, JSON.stringify(common, null, "\t") + "\n")
	fs.writeFileSync(settingsPath, JSON.stringify(settings, null, "\t") + "\n")
})

console.log("\n✅ Consolidation complete! All doesNotSupport keys moved to settings.json under modelInfoView section.")
