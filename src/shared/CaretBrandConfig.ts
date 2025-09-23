// CARET MODIFICATION: Caret feature configuration system
// 캐럿 기능 설정을 관리하는 시스템

export interface CaretFeatureConfig {
	/** 페르소나 설정 표시 여부 */
	showPersonaSettings: boolean
	/** 페르소나 시스템 기본 활성화 상태 */
	defaultPersonaEnabled: boolean
	/** API 설정 완료 후 이동할 위치 */
	redirectAfterApiSetup: "persona" | "home"
	/** 기본 모드 시스템 */
	defaultModeSystem: "caret" | "cline"
	// 향후 추가될 기능별 옵션들
}

// 기본 기능 설정
const defaultFeatures: CaretFeatureConfig = {
	showPersonaSettings: true, // 기본: 페르소나 설정 표시
	defaultPersonaEnabled: true, // 기본: 페르소나 시스템 활성화
	redirectAfterApiSetup: "persona", // 기본: 페르소나로 이동
	defaultModeSystem: "caret",
}

// 간소화된 기능 설정 (엔터프라이즈/비즈니스 환경용)
const simplifiedFeatures: CaretFeatureConfig = {
	showPersonaSettings: false, // 간소화: 페르소나 설정 숨김
	defaultPersonaEnabled: false, // 간소화: 페르소나 시스템 비활성화
	redirectAfterApiSetup: "home", // 간소화: 홈으로 이동
	defaultModeSystem: "cline", // 간소화: Cline 모드
}

// 현재 기능 설정을 가져오는 함수
export function getCurrentFeatureConfig(): CaretFeatureConfig {
	// CARET MODIFICATION: Feature variant marker
	const FEATURE_VARIANT = "default" // 기능 변환 시 변경됨: 'default' | 'simplified'

	// 동적 설정 로딩: 외부 설정 파일이나 환경변수로부터 설정을 읽어올 수 있음
	const dynamicVariant = loadDynamicFeatureVariant()
	const activeVariant = dynamicVariant || FEATURE_VARIANT

	return activeVariant === "simplified" ? simplifiedFeatures : defaultFeatures
}

// 동적 기능 변형을 로드하는 함수
function loadDynamicFeatureVariant(): string | null {
	// Node.js 환경에서만 파일시스템 접근 가능
	if (typeof require !== "undefined") {
		try {
			const fs = require("fs")
			const path = require("path")

			// 프로젝트 루트에서 브랜드 설정 파일 확인
			const brandConfigPath = path.join(process.cwd(), ".caret-brand-config.json")
			if (fs.existsSync(brandConfigPath)) {
				const brandConfig = JSON.parse(fs.readFileSync(brandConfigPath, "utf8"))
				return brandConfig.featureVariant || null
			}
		} catch (error) {
			// 파일 로드 실패시 무시하고 기본값 사용
			console.debug("[CaretBrandConfig] Failed to load dynamic config:", error)
		}
	}

	return null
}
