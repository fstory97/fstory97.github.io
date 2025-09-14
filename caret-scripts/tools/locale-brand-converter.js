#!/usr/bin/env node

/**
 * Locale Brand Converter
 * i18n locale 파일의 브랜드명을 일괄 변환하는 도구
 *
 * Usage:
 * node locale-brand-converter.js caret codecenter
 * node locale-brand-converter.js codecenter caret
 * node locale-brand-converter.js --status
 *
 * @author Luke Yang + Claude Code
 * @version 1.0.0
 */

const fs = require("fs")
const path = require("path")

class LocaleBrandConverter {
	constructor() {
		this.projectRoot = process.cwd()
		this.brandsDir = path.join(this.projectRoot, "caret-b2b", "brands")
		this.localeSourceDir = path.join(this.projectRoot, "webview-ui", "src", "caret", "locale")

		// 브랜드별 변환 규칙
		this.brandMappings = {
			"caret-to-codecenter": {
				// 영어
				Caret: "CodeCenter",
				caret: "codecenter",
				CARET: "CODECENTER",

				// 한국어
				캐럿: "코드센터",

				// 일본어
				キャレット: "コードセンター",

				// 중국어
				克拉: "代码中心",
				插入符: "代码中心", // 대체 번역
			},
			"codecenter-to-caret": {
				// 영어
				CodeCenter: "Caret",
				codecenter: "caret",
				CODECENTER: "CARET",

				// 한국어
				코드센터: "캐럿",

				// 일본어
				コードセンター: "キャレット",

				// 중국어
				代码中心: "克拉",
			},
		}

		this.stats = {
			filesProcessed: 0,
			totalReplacements: 0,
			errors: [],
		}
	}

	/**
	 * 색상 로그 출력
	 */
	log(message, type = "info") {
		const colors = {
			info: "\x1b[36m", // cyan
			success: "\x1b[32m", // green
			warning: "\x1b[33m", // yellow
			error: "\x1b[31m", // red
			reset: "\x1b[0m",
		}

		const color = colors[type] || colors.info
		console.log(`${color}${message}${colors.reset}`)
	}

	/**
	 * 현재 locale 상태 확인
	 */
	checkStatus() {
		this.log("\n=== Locale Brand Status ===", "info")

		// Caret locale 확인
		if (fs.existsSync(this.localeSourceDir)) {
			const caretFiles = this.countLocaleFiles(this.localeSourceDir)
			this.log(`\n📁 Caret locale: ${caretFiles.total} files (${caretFiles.languages.join(", ")})`, "info")
		} else {
			this.log("\n❌ Caret locale directory not found", "error")
		}

		// 각 브랜드의 locale 확인
		const brands = this.getAvailableBrands()
		for (const brand of brands) {
			const brandLocaleDir = path.join(this.brandsDir, brand, "locale")
			if (fs.existsSync(brandLocaleDir)) {
				const brandFiles = this.countLocaleFiles(brandLocaleDir)
				this.log(`📁 ${brand} locale: ${brandFiles.total} files (${brandFiles.languages.join(", ")})`, "info")

				// 샘플 텍스트로 브랜드 확인
				const sampleFile = path.join(brandLocaleDir, "en", "welcome.json")
				if (fs.existsSync(sampleFile)) {
					const content = fs.readFileSync(sampleFile, "utf8")
					if (content.includes("CodeCenter")) {
						this.log(`   └─ Brand: CodeCenter`, "success")
					} else if (content.includes("Caret")) {
						this.log(`   └─ Brand: Caret`, "success")
					} else {
						this.log(`   └─ Brand: Unknown`, "warning")
					}
				}
			} else {
				this.log(`📁 ${brand} locale: Not found`, "warning")
			}
		}
	}

	/**
	 * locale 파일 개수 세기
	 */
	countLocaleFiles(dir) {
		const languages = []
		let total = 0

		if (fs.existsSync(dir)) {
			const entries = fs.readdirSync(dir, { withFileTypes: true })
			for (const entry of entries) {
				if (entry.isDirectory()) {
					languages.push(entry.name)
					const langDir = path.join(dir, entry.name)
					const files = fs.readdirSync(langDir).filter((f) => f.endsWith(".json"))
					total += files.length
				}
			}
		}

		return { total, languages }
	}

	/**
	 * 사용 가능한 브랜드 목록
	 */
	getAvailableBrands() {
		if (!fs.existsSync(this.brandsDir)) {
			return []
		}

		return fs
			.readdirSync(this.brandsDir, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name)
	}

	/**
	 * 디렉토리 복사 (재귀)
	 */
	copyDirectory(source, target) {
		if (!fs.existsSync(target)) {
			fs.mkdirSync(target, { recursive: true })
		}

		const entries = fs.readdirSync(source, { withFileTypes: true })

		for (const entry of entries) {
			const sourcePath = path.join(source, entry.name)
			const targetPath = path.join(target, entry.name)

			if (entry.isDirectory()) {
				this.copyDirectory(sourcePath, targetPath)
			} else {
				fs.copyFileSync(sourcePath, targetPath)
			}
		}
	}

	/**
	 * 디렉토리 삭제 (재귀)
	 */
	removeDirectory(dir) {
		if (fs.existsSync(dir)) {
			fs.readdirSync(dir).forEach((file) => {
				const curPath = path.join(dir, file)
				if (fs.lstatSync(curPath).isDirectory()) {
					this.removeDirectory(curPath)
				} else {
					fs.unlinkSync(curPath)
				}
			})
			fs.rmdirSync(dir)
		}
	}

	/**
	 * JSON 파일에서 브랜드명 변환 (안전한 JSON 파싱 방식)
	 */
	convertJsonFile(filePath, mappings) {
		try {
			const content = fs.readFileSync(filePath, "utf8")
			let replacements = 0

			// JSON 파싱으로 유효성 검증
			let jsonData
			try {
				jsonData = JSON.parse(content)
			} catch (parseError) {
				this.log(`  ⚠️ Invalid JSON in ${path.basename(filePath)}: ${parseError.message}`, "warning")
				// JSON이 유효하지 않으면 텍스트 방식으로 fallback
				return this.convertJsonFileAsText(filePath, mappings)
			}

			// 정렬된 매핑 (긴 문자열부터 처리)
			const sortedMappings = Object.entries(mappings).sort((a, b) => b[0].length - a[0].length)

			// JSON 객체 내의 문자열 값만 변환
			function replaceInObject(obj) {
				for (const key in obj) {
					if (obj[key] === null || obj[key] === undefined) {
						continue
					}

					if (typeof obj[key] === "string") {
						let newValue = obj[key]
						for (const [from, to] of sortedMappings) {
							const regex = new RegExp(from, "g")
							const matches = newValue.match(regex)
							if (matches) {
								newValue = newValue.replace(regex, to)
								replacements += matches.length
							}
						}
						obj[key] = newValue
					} else if (typeof obj[key] === "object") {
						replaceInObject(obj[key])
					}
				}
			}

			replaceInObject(jsonData)

			if (replacements > 0) {
				// JSON을 다시 문자열로 변환 (들여쓰기 2칸)
				const newContent = JSON.stringify(jsonData, null, 2)
				fs.writeFileSync(filePath, newContent, "utf8")
				this.log(`  ✅ ${path.basename(filePath)}: ${replacements} replacements (JSON-safe)`, "success")
			}

			return replacements
		} catch (error) {
			this.log(`  ❌ Error processing ${path.basename(filePath)}: ${error.message}`, "error")
			this.stats.errors.push({ file: filePath, error: error.message })
			return 0
		}
	}

	/**
	 * JSON 파일을 텍스트로 변환 (fallback)
	 */
	convertJsonFileAsText(filePath, mappings) {
		try {
			let content = fs.readFileSync(filePath, "utf8")
			let replacements = 0

			// 정렬된 매핑 (긴 문자열부터 처리)
			const sortedMappings = Object.entries(mappings).sort((a, b) => b[0].length - a[0].length)

			for (const [from, to] of sortedMappings) {
				const regex = new RegExp(from, "g")
				const matches = content.match(regex)

				if (matches) {
					content = content.replace(regex, to)
					replacements += matches.length
				}
			}

			if (replacements > 0) {
				fs.writeFileSync(filePath, content, "utf8")
				this.log(`  ⚠️ ${path.basename(filePath)}: ${replacements} replacements (text mode)`, "warning")
			}

			return replacements
		} catch (error) {
			this.log(`  ❌ Error processing ${path.basename(filePath)}: ${error.message}`, "error")
			this.stats.errors.push({ file: filePath, error: error.message })
			return 0
		}
	}

	/**
	 * locale 디렉토리 전체 변환
	 */
	convertLocaleDirectory(sourceDir, targetDir, mappings) {
		// 대상 디렉토리 초기화
		if (fs.existsSync(targetDir)) {
			this.log(`\n📋 Backing up existing locale...`, "info")
			const backupDir = targetDir + ".backup"
			if (fs.existsSync(backupDir)) {
				this.removeDirectory(backupDir)
			}
			this.copyDirectory(targetDir, backupDir)
			this.removeDirectory(targetDir)
		}

		// 소스 복사
		this.log(`\n📁 Copying locale files...`, "info")
		this.copyDirectory(sourceDir, targetDir)

		// 브랜드 변환
		this.log(`\n🔄 Converting brand names...`, "info")
		const languages = fs
			.readdirSync(targetDir, { withFileTypes: true })
			.filter((d) => d.isDirectory())
			.map((d) => d.name)

		for (const lang of languages) {
			this.log(`\n Language: ${lang}`, "info")
			const langDir = path.join(targetDir, lang)
			const files = fs.readdirSync(langDir).filter((f) => f.endsWith(".json"))

			for (const file of files) {
				const filePath = path.join(langDir, file)
				const replacements = this.convertJsonFile(filePath, mappings)
				this.stats.filesProcessed++
				this.stats.totalReplacements += replacements
			}
		}
	}

	/**
	 * 메인 변환 실행
	 */
	convert(fromBrand, toBrand) {
		const mappingKey = `${fromBrand}-to-${toBrand}`
		const mappings = this.brandMappings[mappingKey]

		if (!mappings) {
			this.log(`\n❌ Unsupported conversion: ${fromBrand} → ${toBrand}`, "error")
			this.log(`   Supported: caret ↔ codecenter`, "info")
			return false
		}

		// 소스와 대상 디렉토리 결정
		let sourceDir, targetDir

		if (fromBrand === "caret") {
			sourceDir = this.localeSourceDir
			targetDir = path.join(this.brandsDir, toBrand, "locale")
		} else {
			sourceDir = path.join(this.brandsDir, fromBrand, "locale")
			targetDir = path.join(this.brandsDir, toBrand, "locale")
		}

		if (!fs.existsSync(sourceDir)) {
			this.log(`\n❌ Source locale not found: ${sourceDir}`, "error")
			return false
		}

		this.log(`\n${"=".repeat(50)}`, "info")
		this.log(`🚀 Starting Locale Brand Conversion`, "info")
		this.log(`   From: ${fromBrand}`, "info")
		this.log(`   To: ${toBrand}`, "info")
		this.log(`${"=".repeat(50)}`, "info")

		// 변환 실행
		this.convertLocaleDirectory(sourceDir, targetDir, mappings)

		// 결과 출력
		this.log(`\n${"=".repeat(50)}`, "info")
		this.log(`✨ Conversion Complete!`, "success")
		this.log(`   Files processed: ${this.stats.filesProcessed}`, "info")
		this.log(`   Total replacements: ${this.stats.totalReplacements}`, "info")

		if (this.stats.errors.length > 0) {
			this.log(`   Errors: ${this.stats.errors.length}`, "error")
			for (const err of this.stats.errors) {
				this.log(`     - ${path.basename(err.file)}: ${err.error}`, "error")
			}
		}

		this.log(`${"=".repeat(50)}`, "info")

		return true
	}

	/**
	 * CLI 실행
	 */
	run() {
		const args = process.argv.slice(2)

		if (args.length === 0 || args.includes("--help")) {
			this.showHelp()
			return
		}

		if (args.includes("--status")) {
			this.checkStatus()
			return
		}

		if (args.length < 2) {
			this.log("\n❌ Error: Please specify both source and target brands", "error")
			this.showHelp()
			return
		}

		const [fromBrand, toBrand] = args
		this.convert(fromBrand, toBrand)
	}

	/**
	 * 도움말 표시
	 */
	showHelp() {
		console.log(`
Locale Brand Converter - i18n locale 파일 브랜드 변환 도구

Usage:
  node locale-brand-converter.js <from> <to>
  node locale-brand-converter.js --status
  node locale-brand-converter.js --help

Examples:
  node locale-brand-converter.js caret codecenter
  node locale-brand-converter.js codecenter caret

Options:
  --status    Check current locale status for all brands
  --help      Show this help message

Supported brands:
  - caret
  - codecenter

Notes:
  - Always backs up existing locale before conversion
  - Converts all language files (en, ko, ja, zh)
  - Preserves JSON structure and formatting
        `)
	}
}

// 실행
const converter = new LocaleBrandConverter()
converter.run()
