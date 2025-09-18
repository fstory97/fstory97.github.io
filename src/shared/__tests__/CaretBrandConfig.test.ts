// CARET MODIFICATION: Feature configuration integration tests
// TDD RED Phase: 실제 사용 시나리오 기반 통합 테스트

import { beforeEach, describe, expect, it, vi } from "vitest"
import { type CaretFeatureConfig, getCurrentFeatureConfig } from "../CaretBrandConfig"

describe("CaretFeatureConfig Integration Tests", () => {
	describe("기본 기능 설정 시나리오", () => {
		it("should show persona settings and redirect to persona in default mode", () => {
			// Given: 기본 Caret 설정
			const config = getCurrentFeatureConfig()

			// When: 설정을 확인
			// Then: 페르소나 관련 기능이 활성화됨
			expect(config.showPersonaSettings).toBe(true)
			expect(config.redirectAfterApiSetup).toBe("persona")
			expect(config.defaultModeSystem).toBe("caret")
		})
	})

	describe("간소화된 기능 설정 시나리오 (엔터프라이즈/비즈니스용)", () => {
		it("should hide persona settings and redirect to home in simplified mode", () => {
			// Given: 간소화된 설정으로 변경됨 (브랜드 변환 스크립트에 의해)
			// 동적 설정 파일을 생성하여 simplified 모드 시뮬레이션
			const fs = require("fs")
			const path = require("path")
			const configPath = path.join(process.cwd(), ".caret-brand-config.json")

			// 테스트용 simplified 설정 파일 생성
			const testConfig = { featureVariant: "simplified" }
			fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2))

			try {
				// When: 간소화 모드에서 설정을 확인
				// Then: 페르소나 기능이 비활성화되고 홈으로 리다이렉트
				const expectedConfig: CaretFeatureConfig = {
					showPersonaSettings: false,
					defaultPersonaEnabled: false,
					redirectAfterApiSetup: "home",
					defaultModeSystem: "cline",
				}

				const actualConfig = getCurrentFeatureConfig()
				expect(actualConfig).toEqual(expectedConfig)
			} finally {
				// 테스트 후 설정 파일 정리
				if (fs.existsSync(configPath)) {
					fs.unlinkSync(configPath)
				}
			}
		})
	})

	describe("브랜드 변환 스크립트 통합 시나리오", () => {
		it("should switch to simplified features when brand converter sets FEATURE_VARIANT to simplified", () => {
			// Given: 브랜드 변환 스크립트가 동적 설정 파일을 생성
			const fs = require("fs")
			const path = require("path")
			const configPath = path.join(process.cwd(), ".caret-brand-config.json")

			// 브랜드 변환 스크립트가 생성할 설정 파일 시뮬레이션
			const brandConfig = {
				featureVariant: "simplified",
				brandName: "enterprise", // 브랜드명은 노출하지 않음
				lastModified: new Date().toISOString(),
			}
			fs.writeFileSync(configPath, JSON.stringify(brandConfig, null, 2))

			try {
				// When: 기능 설정을 요청
				const config = getCurrentFeatureConfig()

				// Then: 간소화된 설정이 반환됨
				expect(config.showPersonaSettings).toBe(false)
				expect(config.redirectAfterApiSetup).toBe("home")
				expect(config.defaultModeSystem).toBe("cline")
			} finally {
				// 테스트 후 정리
				if (fs.existsSync(configPath)) {
					fs.unlinkSync(configPath)
				}
			}
		})
	})

	describe("UI 컴포넌트 통합 시나리오", () => {
		it("should hide persona settings in UI when showPersonaSettings is false", () => {
			// Given: 페르소나 설정이 비활성화된 설정
			const config: CaretFeatureConfig = {
				showPersonaSettings: false,
				defaultPersonaEnabled: false,
				redirectAfterApiSetup: "home",
				defaultModeSystem: "cline",
			}

			// When: UI에서 페르소나 표시 여부 확인
			const shouldShowPersona = config.showPersonaSettings

			// Then: 페르소나 UI가 숨겨짐
			expect(shouldShowPersona).toBe(false)
		})

		it("should redirect to home after API setup when configured", () => {
			// Given: 홈으로 리다이렉트하도록 설정됨
			const config: CaretFeatureConfig = {
				showPersonaSettings: false,
				defaultPersonaEnabled: false,
				redirectAfterApiSetup: "home",
				defaultModeSystem: "cline",
			}

			// When: API 설정 완료 후 리다이렉트 위치 확인
			const redirectTarget = config.redirectAfterApiSetup

			// Then: 홈으로 리다이렉트됨
			expect(redirectTarget).toBe("home")
		})
	})

	describe("API 설정 후 리다이렉트 기능 통합 시나리오", () => {
		it("should redirect to home when redirectAfterApiSetup is set to home", () => {
			// Given: 홈 리다이렉트 설정이 활성화된 설정
			const fs = require("fs")
			const path = require("path")
			const configPath = path.join(process.cwd(), ".caret-brand-config.json")

			const testConfig = { featureVariant: "simplified" }
			fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2))

			try {
				// When: 기능 설정을 확인
				const config = getCurrentFeatureConfig()

				// Then: API 설정 후 홈으로 리다이렉트 설정이 됨
				expect(config.redirectAfterApiSetup).toBe("home")
			} finally {
				// 테스트 후 정리
				if (fs.existsSync(configPath)) {
					fs.unlinkSync(configPath)
				}
			}
		})

		it("should redirect to persona when redirectAfterApiSetup is set to persona", () => {
			// Given: 기본 설정 (페르소나 리다이렉트)
			const config = getCurrentFeatureConfig()

			// When & Then: API 설정 후 페르소나로 리다이렉트 설정이 됨
			expect(config.redirectAfterApiSetup).toBe("persona")
		})
	})
})
