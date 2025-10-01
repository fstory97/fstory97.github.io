# 기능 선택 빌드 옵션 시스템 (Feature Config System)

Caret의 **기능 선택 빌드 옵션 시스템**은 다양한 배포 환경(일반 사용자용, 엔터프라이즈용)에 맞춰 기능을 동적으로 켜고 끌 수 있는 설정 시스템입니다.

## 📋 **기능 개요**

### **핵심 개념**
- **기본 설정**: 모든 기능이 활성화된 완전한 Caret 경험
- **커스텀 설정**: `.caret-feature-config.json` 파일을 통한 특정 기능 오버라이드
- **동적 제어**: 런타임에 기능별 세부 설정 가능

### **제어 가능한 기능들**
| 설정 키 | 기본값 | 설명 |
|---|---|---|
| **showPersonaSettings** | true | 페르소나 설정 표시 여부 |
| **defaultPersonaEnabled** | true | 페르소나 시스템 기본 활성화 상태 |
| **redirectAfterApiSetup** | "persona" | API 설정 완료 후 이동할 위치 |
| **defaultModeSystem** | "caret" | 기본 AI 동작 모드 |
| **firstListingProvider** | "openrouter" | API 설정 화면 최상단 프로바이더 |
| **defaultProvider** | "openrouter" | 기본 선택 프로바이더 |
| **showOnlyDefaultProvider** | false | 기본 프로바이더만 표시할지 여부 |
| **showCostInformation** | true | 채팅 헤더와 행에서 비용 정보 표시 여부 |

## 🏗️ **시스템 아키텍처**

### **파일 구조**
```
caret-src/shared/
├── FeatureConfig.ts              # 메인 설정 시스템
└── feature-config.json           # 정적 설정 파일 (컴파일 타임 로딩)
```

### **핵심 인터페이스**
```typescript
export interface FeatureConfig {
    /** 페르소나 설정 표시 여부 */
    showPersonaSettings: boolean
    /** 페르소나 시스템 기본 활성화 상태 */
    defaultPersonaEnabled: boolean
    /** API 설정 완료 후 이동할 위치 */
    redirectAfterApiSetup: "persona" | "home"
    /** 기본 모드 시스템 */
    defaultModeSystem: "caret" | "cline"
    /** API 설정 화면에 최상단에 노출할 프로바이더 */
    firstListingProvider: string
    /** 기본 프로바이더 */
    defaultProvider: string
    /** 기본 프로바이더만 표시할지 여부 */
    showOnlyDefaultProvider: boolean
    /** 비용 정보 표시 여부 */
    showCostInformation: boolean
}
```

## 🎛️ **설정 방식**

### **기본 설정 (코드 내장)**
```typescript
const defaultFeatures: FeatureConfig = {
    showPersonaSettings: true,
    defaultPersonaEnabled: true,
    redirectAfterApiSetup: "persona",
    defaultModeSystem: "caret",
    firstListingProvider: "openrouter",
    defaultProvider: "openrouter",
    showOnlyDefaultProvider: false,
    showCostInformation: true,
}
```

### **커스텀 설정 (정적 JSON 파일)**
```json
// caret-src/shared/feature-config.json (엔터프라이즈 환경 예시)
{
    "showPersonaSettings": false,
    "defaultPersonaEnabled": false,
    "redirectAfterApiSetup": "home",
    "defaultModeSystem": "cline",
    "firstListingProvider": "litellm",
    "defaultProvider": "litellm",
    "showOnlyDefaultProvider": true,
    "showCostInformation": false
}
```

## 🔧 **사용법**

### **1. 기본 사용 (코드에서)**
```typescript
import { getCurrentFeatureConfig } from '@shared/FeatureConfig'

// 현재 기능 설정 가져오기
const config = getCurrentFeatureConfig()

// 조건부 렌더링
{config.showPersonaSettings && (
    <PersonaSettingsComponent />
)}

// 기본값 설정
const defaultProvider = config.defaultProvider
```

### **2. 정적 설정 (배포 환경)**
```bash
# 간소화 모드 활성화 (caret-src/shared/feature-config.json 수정)
cat > caret-src/shared/feature-config.json << 'EOF'
{
    "showPersonaSettings": false,
    "defaultPersonaEnabled": false,
    "redirectAfterApiSetup": "home",
    "defaultModeSystem": "cline",
    "firstListingProvider": "litellm",
    "defaultProvider": "litellm",
    "showOnlyDefaultProvider": true,
    "showCostInformation": false
}
EOF

# 일반 모드로 복원 (기본값으로 되돌리기)
cat > caret-src/shared/feature-config.json << 'EOF'
{
    "showPersonaSettings": true,
    "defaultPersonaEnabled": true,
    "redirectAfterApiSetup": "persona",
    "defaultModeSystem": "caret",
    "firstListingProvider": "openrouter",
    "defaultProvider": "openrouter",
    "showOnlyDefaultProvider": false,
    "showCostInformation": true
}
EOF
```

### **3. 백엔드-프론트엔드 연동**
```typescript
// 백엔드: Controller에서 설정 전달
const featureConfig = getCurrentFeatureConfig()
Logger.debug(`[Controller] 📋 Loaded feature config: ${JSON.stringify(featureConfig)}`)

// 프론트엔드: Context에서 설정 사용
const { featureConfig } = useExtensionState()
const showPersona = featureConfig?.showPersonaSettings && modeSystem === "caret"
```

## 🎯 **실제 적용 사례**

### **1. API 프로바이더 목록 제어**
```typescript
// ApiOptions.tsx
const { featureConfig } = useExtensionState()

// 프로바이더 목록 필터링
if (featureConfig.showOnlyDefaultProvider) {
    const defaultProvider = featureConfig.defaultProvider
    const defaultProviderOption = processedOptions.find((option) => option.value === defaultProvider)
    return defaultProviderOption ? [defaultProviderOption] : []
}

// 프로바이더 순서 조정
const firstProvider = featureConfig.firstListingProvider
const sortedOptions = [
    ...processedOptions.filter(option => option.value === firstProvider),
    ...processedOptions.filter(option => option.value !== firstProvider)
]
```

### **2. 최초 설치 시 기본값 설정**
```typescript
// StateManager.ts
if (!this.globalStateCache.planModeApiProvider && !this.globalStateCache.actModeApiProvider) {
    const featureConfig = getCurrentFeatureConfig()
    this.globalStateCache.planModeApiProvider = featureConfig.defaultProvider as any
    this.globalStateCache.actModeApiProvider = featureConfig.defaultProvider as any
    this.scheduleDebouncedPersistence()
}
```

### **3. 조건부 UI 렌더링**
```typescript
// CaretGeneralSettingsSection.tsx
const config = getCurrentFeatureConfig()

{config.showPersonaSettings && modeSystem === "caret" && (
    <PersonaSection>
        <PersonaToggle />
        <PersonaSettings />
    </PersonaSection>
)}
```

### **4. 비용 정보 표시 제어**
```typescript
// TaskHeader.tsx & ChatRow.tsx
const featureConfig = getCurrentFeatureConfig()

// 비용 정보 조건부 표시
{isCostAvailable && featureConfig.showCostInformation && (
    <div>${totalCost?.toFixed(4)}</div>
)}

// VSCodeBadge 투명도 제어
<VSCodeBadge
    style={{
        opacity: cost != null && cost > 0 && featureConfig.showCostInformation ? 1 : 0
    }}
>
    ${cost?.toFixed(4)}
</VSCodeBadge>
```

## 🧪 **테스트 및 검증**

### **TDD 테스트 케이스**
```typescript
describe("FeatureConfig Integration Tests", () => {
    it("should load feature config from static JSON import", () => {
        // Given: 정적 JSON 파일이 import됨
        const config = getCurrentFeatureConfig()

        // When: 설정을 확인
        // Then: JSON 파일의 설정값이 적용됨
        expect(config.showPersonaSettings).toBe(true)
        expect(config.defaultModeSystem).toBe("caret")
        expect(config.showOnlyDefaultProvider).toBe(false)
    })

    it("should show persona settings when enabled in config", () => {
        // Given: 페르소나 설정이 활성화된 설정
        const config: FeatureConfig = {
            showPersonaSettings: true,
            // ... 기타 설정
        }

        // When: UI에서 페르소나 표시 여부 확인
        const shouldShowPersona = config.showPersonaSettings

        // Then: 페르소나 UI가 표시됨
        expect(shouldShowPersona).toBe(true)
    })
})
```

### **수동 테스트 절차**
1. **기본 모드 확인**:
   ```bash
   npm run watch
   # VS Code F5 → API 설정에서 모든 프로바이더 표시 확인
   ```

2. **간소화 모드 테스트**:
   ```bash
   cat > caret-src/shared/feature-config.json << 'EOF'
{
    "showPersonaSettings": false,
    "defaultPersonaEnabled": false,
    "redirectAfterApiSetup": "home",
    "defaultModeSystem": "cline",
    "firstListingProvider": "litellm",
    "defaultProvider": "litellm",
    "showOnlyDefaultProvider": true
}
EOF
   npm run compile
   npm run watch
   # VS Code F5 → LiteLLM만 표시되는지 확인
   ```

## 📊 **빌드 및 배포**

### **컴파일 확인**
```bash
npm run compile     # 전체 빌드 테스트
npm run test:unit   # 기능 설정 테스트 실행
```

### **배포 시나리오**

**일반 사용자 배포**:
```bash
# 설정 파일 없이 배포 (기본 설정 사용)
npm run compile
npm run package
```

**엔터프라이즈 배포**:
```bash
# 1. 커스텀 설정 파일 수정
cat > caret-src/shared/feature-config.json << 'EOF'
{
    "showPersonaSettings": false,
    "defaultPersonaEnabled": false,
    "redirectAfterApiSetup": "home",
    "defaultModeSystem": "cline",
    "firstListingProvider": "litellm",
    "defaultProvider": "litellm",
    "showOnlyDefaultProvider": true
}
EOF

# 2. 빌드 및 패키징 (설정 파일 포함)
npm run compile
npm run package
```

**⚠️ 중요**: `caret-src/shared/feature-config.json` 파일 변경 후 반드시 `npm run compile` 실행 필요 (정적 import 반영)

## ⚙️ **확장 가능성**

### **새 기능 추가**
```typescript
export interface FeatureConfig {
    // 기존 기능들...

    // 새 기능 추가 예시
    showAdvancedSettings: boolean
    enableExperimentalFeatures: boolean
    maxModelCount: number
}
```

### **새 모드 추가**
```typescript
// 전문가 모드 추가
const expertFeatures: FeatureConfig = {
    showPersonaSettings: true,
    showAdvancedSettings: true,
    enableExperimentalFeatures: true,
    // ...
}

export function getCurrentFeatureConfig(): FeatureConfig {
    const FEATURE_VARIANT = "default" // 'default' | 'simplified' | 'expert'

    switch(activeVariant) {
        case "simplified": return simplifiedFeatures
        case "expert": return expertFeatures
        default: return defaultFeatures
    }
}
```

## 🚨 **주의사항**

### **구현 방식 변경**
- **이전**: 런타임 동적 파일 로딩 (fs.readFileSync)
- **현재**: 컴파일 타임 정적 import (import featureConfigData from "./feature-config.json")

### **네이밍 규칙**
- **인터페이스**: `FeatureConfig` (이전: `CaretFeatureConfig`)
- **함수**: `getCurrentFeatureConfig()`
- **로그**: `[FeatureConfig]` (이전: `[CaretBrandConfig]`)

### **정적 설정 우선순위**
1. `caret-src/shared/feature-config.json` 파일 설정
2. `defaultFeatures` 기본값

## 🔮 **향후 계획**

- [ ] **환경변수 지원**: `CARET_FEATURE_VARIANT=simplified` 환경변수 지원
- [ ] **런타임 변경**: 설정 UI에서 실시간 모드 변경 가능
- [ ] **프로파일 시스템**: 여러 설정 프로파일 저장 및 전환
- [ ] **권한 기반 제어**: 사용자 권한에 따른 기능 접근 제어

---

**문서 버전**: v1.0 (2025-09-30)
**담당**: Luke Yang + Claude Code
**관련 이슈**: [caret-b2b/worklog/20250929-issue1-litellm-default.md]