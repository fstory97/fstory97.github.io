const fs = require("fs")
const path = require("path")

// Define the proper translations for Korean settings.json
const koreanTranslations = {
	doesNotSupportBrowser: "브라우저 사용 미지원",
	doesNotSupportCache: "프롬프트 캐싱 미지원",
	doesNotSupportImagesLabel: "이미지 미지원:",
	doesNotSupportComputerUseLabel: "컴퓨터 사용 미지원:",
	doesNotSupportCacheLabel: "프롬프트 캐싱 미지원:",
}

const settingsPath = "webview-ui/src/caret/locale/ko/settings.json"

// Read Korean settings.json
const settingsData = JSON.parse(fs.readFileSync(settingsPath, "utf8"))

console.log("🔍 Fixing Korean hardcoded values in settings.json...")

// Update the hardcoded English values with Korean translations
Object.keys(koreanTranslations).forEach((key) => {
	if (settingsData.providers && settingsData.providers[key]) {
		const oldValue = settingsData.providers[key]
		const newValue = koreanTranslations[key]
		console.log(`📝 Updating ${key}: "${oldValue}" → "${newValue}"`)
		settingsData.providers[key] = newValue
	}
})

// Write back the corrected file
fs.writeFileSync(settingsPath, JSON.stringify(settingsData, null, "\t") + "\n")

console.log("✅ Korean settings.json fixed!")

// Also check for consistency between common.json and settings.json keys
console.log("\n🔍 Checking consistency between common.json and settings.json...")

const languages = ["en", "ko", "ja", "zh"]

languages.forEach((lang) => {
	const commonPath = `webview-ui/src/caret/locale/${lang}/common.json`
	const settingsPath = `webview-ui/src/caret/locale/${lang}/settings.json`

	const common = JSON.parse(fs.readFileSync(commonPath, "utf8"))
	const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"))

	console.log(`\n📋 Language: ${lang}`)

	// Check for duplicate keys between common and settings
	const commonKeys = Object.keys(common.common || {}).filter((k) => k.startsWith("doesNotSupport"))
	const settingsKeys = Object.keys(settings.providers || {}).filter((k) => k.startsWith("doesNotSupport"))

	console.log(`  Common keys: ${commonKeys.join(", ")}`)
	console.log(`  Settings keys: ${settingsKeys.join(", ")}`)
})
