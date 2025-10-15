# F05 - Rule Priority System

**상태**: ✅ Phase 4 완료 + 버그 수정 완료 (2025-10-15)
**구현도**: 100% 완료
**우선순위**: MEDIUM - 토큰 낭비 방지

---

## 📋 개요

**목표**: 규칙 파일 중복 로딩 방지 - 토큰 사용량 최적화

**해결하는 문제**:
- Cline: `.clinerules`, `.cursorrules`, `.windsurfrules` 모두 로딩 → 중복 낭비
- Caret: **우선순위 기반 단일 선택** → 중복 완전 차단

**우선순위 규칙**:
```
.caretrules > .clinerules > .cursorrules > .windsurfrules
```

---

## 🏗️ Backend 구현 (Phase 4 + 버그 수정)

### ✅ Phase 4: 핵심 파일 수정

**1. external-rules.ts** (+151 lines)
```
src/core/context/instructions/user-instructions/external-rules.ts
- 우선순위 로직 구현
- 자동 토글 비활성화
- Caret 규칙 최우선 처리
```

**핵심 로직**:
```typescript
// CARET MODIFICATION: Rule priority system
const caretHasFiles = Object.keys(updatedLocalCaretToggles).length > 0
const clineHasFiles = Object.keys(localClineRulesToggles).length > 0
const cursorHasFiles = Object.keys(updatedLocalCursorToggles).length > 0
const windsurfHasFiles = Object.keys(updatedLocalWindsurfToggles).length > 0

let effectiveCaretToggles = updatedLocalCaretToggles
let effectiveClineToggles = localClineRulesToggles
let effectiveCursorToggles = updatedLocalCursorToggles
let effectiveWindsurfToggles = updatedLocalWindsurfToggles
let activeSource: RulePrioritySource = null

if (caretHasFiles) {
    activeSource = "caret"
    effectiveClineToggles = {}
    effectiveCursorToggles = {}
    effectiveWindsurfToggles = {}
} else if (clineHasFiles) {
    activeSource = "cline"
    // 각 규칙 소스가 자신의 토글만 유지
    effectiveCaretToggles = {}
    effectiveCursorToggles = {}
    effectiveWindsurfToggles = {}
} else if (cursorHasFiles) {
    activeSource = "cursor"
    effectiveCaretToggles = {}
    effectiveClineToggles = {}
    effectiveWindsurfToggles = {}
} else if (windsurfHasFiles) {
    activeSource = "windsurf"
    effectiveCaretToggles = {}
    effectiveClineToggles = {}
    effectiveCursorToggles = {}
}
```

**2. disk.ts** (CARET MODIFICATION)
```
src/core/storage/disk.ts
- .caretrules 파일명 정의
- 브랜드별 동적 디렉토리 지원
- BRAND_RULES_DIR = `.${BRAND_SLUG}rules`
```

**3. state-keys.ts** (CARET MODIFICATION)
```
src/core/storage/state-keys.ts
- caretLocalRulesToggles 상태 키 추가
```

---

### 🐛 2025-10-15 버그 수정

#### 버그 1: 우선순위 로직 오류 ⚠️ 치명적
**문제**: `.clinerules`만 존재할 때 UI는 `.caretrules`가 활성화된 것처럼 표시되지만, AI에게는 아무 내용도 전달되지 않음

**원인**:
```typescript
// ❌ 잘못된 코드 - .clinerules 토글을 .caretrules 상태로 복사
else if (clineHasFiles) {
    activeSource = "cline"
    effectiveCaretToggles = cloneToggles(localClineRulesToggles)  // ← 문제!
    effectiveClineToggles = {}
}
```

이 코드는 두 가지 문제를 일으킴:
1. **UI 오해**: `effectiveCaretToggles`에 파일 목록이 있어서 UI는 `.caretrules`가 활성화된 것처럼 표시
2. **내용 누락**: `getLocalCaretRules()`는 실제 `.caretrules` 디렉토리를 읽으려고 하지만 존재하지 않아 빈 결과 반환

**해결**:
```typescript
// ✅ 올바른 코드 - 각 규칙 소스가 자신의 토글만 유지
else if (clineHasFiles) {
    activeSource = "cline"
    effectiveCaretToggles = {}  // ← .caretrules는 비활성화
    effectiveCursorToggles = {}
    effectiveWindsurfToggles = {}
}
// effectiveClineToggles는 localClineRulesToggles를 그대로 유지
```

**핵심 원칙**: 각 규칙 소스(`caret`, `cline`, `cursor`, `windsurf`)는 **자신의 토글 상태만 관리**하고, 다른 소스로 복사하지 않음

**수정 파일**: `src/core/context/instructions/user-instructions/external-rules.ts:95-132`

---

#### 버그 2: 파일 확장자 필터링 오류
**문제**: `.caretrules` 디렉토리의 파일이 감지되지 않음

**원인**:
```typescript
// ❌ 잘못된 코드
await synchronizeRuleToggles(localCaretRulesFilePath, localCaretRulesToggles, "*.*", ...)
// "*.*"는 문자열 리터럴로 처리되어 실제 확장자와 매치되지 않음
```

**해결**:
```typescript
// ✅ 올바른 코드
await synchronizeRuleToggles(localCaretRulesFilePath, localCaretRulesToggles, "", ...)
// 빈 문자열 = 모든 파일 허용 (.md, .json, .yaml 등)
```

**수정 파일**: `src/core/context/instructions/user-instructions/external-rules.ts:53-56`

---

#### 버그 3: 규칙 생성 위치 오류
**문제**: 새 규칙 파일 생성 시 항상 `.clinerules`에 생성됨

**원인**:
```typescript
// ❌ 하드코딩된 .clinerules
const localClineRulesFilePath = path.resolve(cwd, GlobalFileNames.clineRules)
```

**해결**:
```typescript
// ✅ 브랜드별 동적 디렉토리
const localCaretRulesFilePath = path.resolve(cwd, GlobalFileNames.caretRules)
// Caret: .caretrules / CodeCenter: .codecenterrules
```

**수정 파일**: `src/core/context/instructions/user-instructions/rule-helpers.ts:169-207`

---

#### 버그 4: 규칙 생성 후 토글 업데이트 누락
**문제**: 규칙 파일 생성 후 UI에 반영되지 않음

**해결**:
```typescript
// CARET MODIFICATION: Refresh both Cline and external rules
const clineToggles = await refreshClineRulesToggles(controller, cwd)
await refreshExternalRulesToggles(controller, cwd, { clineLocalToggles: clineToggles.localToggles })
```

**수정 파일**: `src/core/controller/file/createRuleFile.ts:57-59`

---

#### 버그 5: RefreshRules 반환값 누락
**문제**: `refreshRules` 함수가 `caretLocalToggles`를 UI에 반환하지 않음

**해결**:
```typescript
// CARET MODIFICATION: Get caretLocalToggles from refreshExternalRulesToggles
const { caretLocalToggles, cursorLocalToggles, windsurfLocalToggles } = await refreshExternalRulesToggles(
    controller,
    cwd,
    { clineLocalToggles: localToggles },
)

return RefreshedRules.create({
    // ... 기타 토글들
    localCaretRulesToggles: { toggles: caretLocalToggles },  // ← 추가!
})
```

**수정 파일**: `src/core/controller/file/refreshRules.ts:19-35`

---

#### 버그 6: AI 프롬프트에 .caretrules 내용 누락 ⚠️ 치명적 (Part 1: Cline 시스템)
**문제**: `.caretrules` 토글은 활성화되지만 **실제 규칙 내용이 AI에게 전달되지 않음**

**원인**:
1. `task/index.ts:1341`에서 `getLocalCaretRules`를 호출하지 않음
2. `promptContext`에 `localCaretRulesFileInstructions` 필드 없음
3. `user_instructions.ts`에서 `.caretrules` 내용을 프롬프트에 추가하지 않음

**해결**:

**1) task/index.ts 수정**:
```typescript
// Import 추가
import {
    getLocalCaretRules,  // ← 추가
    getLocalCursorRules,
    getLocalWindsurfRules,
    refreshExternalRulesToggles,
} from "@core/context/instructions/user-instructions/external-rules"

// 토글 및 내용 로드
const { caretLocalToggles, windsurfLocalToggles, cursorLocalToggles } = await refreshExternalRulesToggles(
    this.controller,
    this.cwd,
    { clineLocalToggles: localToggles },
)

const localCaretRulesFileInstructions = await getLocalCaretRules(this.cwd, caretLocalToggles)  // ← 추가
const localClineRulesFileInstructions = await getLocalClineRules(this.cwd, localToggles)

// 프롬프트 컨텍스트에 추가
const promptContext: SystemPromptContext = {
    // ... 기타 필드들
    localCaretRulesFileInstructions,  // ← 추가
}
```

**2) types.ts 수정**:
```typescript
export interface SystemPromptContext {
    // ... 기타 필드들
    readonly localClineRulesFileInstructions?: string
    readonly localCaretRulesFileInstructions?: string  // ← 추가
    readonly localCursorRulesFileInstructions?: string
}
```

**3) user_instructions.ts 수정**:
```typescript
export async function getUserInstructions(variant: PromptVariant, context: SystemPromptContext) {
    const customInstructions = buildUserInstructions(
        context.globalClineRulesFileInstructions,
        context.localClineRulesFileInstructions,
        context.localCaretRulesFileInstructions,  // ← 추가
        context.localCursorRulesFileInstructions,
        // ... 기타 파라미터들
    )
}

function buildUserInstructions(
    globalClineRulesFileInstructions?: string,
    localClineRulesFileInstructions?: string,
    localCaretRulesFileInstructions?: string,  // ← 추가
    // ... 기타 파라미터들
) {
    const customInstructions = []
    // ... 기타 규칙들

    // CARET MODIFICATION: Add .caretrules content to AI prompt
    if (localCaretRulesFileInstructions) {
        customInstructions.push(localCaretRulesFileInstructions)
    }

    // ... 기타 처리
}
```

**수정 파일**:
- `src/core/task/index.ts:17, 1343-1359, 1387`
- `src/core/prompts/system-prompt/types.ts:100`
- `src/core/prompts/system-prompt/components/user_instructions.ts:15, 38, 53-55`

---

#### 버그 7: Caret 프롬프트 시스템에서 규칙 무시 ⚠️ 치명적 (Part 2: Caret Adapter)
**문제**: 버그 6 수정 후에도 **Caret 프롬프트 모드에서 `.caretrules` 내용이 AI에게 전달되지 않음**

**원인**:
- `CaretJsonAdapter`가 `CARET_USER_INSTRUCTIONS` 섹션 처리 시 **JSON 템플릿만 사용**
- Cline의 실제 규칙 시스템(`getUserInstructions()`)을 호출하지 않음
- `task/index.ts`에서는 규칙을 로드하지만, Caret 프롬프트 시스템은 독립적으로 동작하여 무시

**동작 흐름**:
```
1. task/index.ts → getLocalCaretRules() 호출 ✅
2. task/index.ts → promptContext에 localCaretRulesFileInstructions 설정 ✅
3. Cline 프롬프트 시스템 → getUserInstructions() → 규칙 포함 ✅
4. Caret 프롬프트 시스템 → JSON 템플릿만 사용 ❌ (규칙 무시)
```

**해결**:

**1) CaretJsonAdapter.ts 수정 - 새 메서드 추가**:
```typescript
/**
 * Gets user instructions from Cline's actual system (.caretrules, .clinerules, etc.)
 * CARET MODIFICATION: This ensures .caretrules content is actually passed to AI
 */
private async getClineUserInstructions(context: CaretSystemPromptContext, isChatbotMode: boolean): Promise<string | null> {
    try {
        // Import Cline's getUserInstructions function
        const { getUserInstructions } = await import("@core/prompts/system-prompt/components/user_instructions")

        // Get the appropriate variant for the model using PromptRegistry
        const registry = PromptRegistry.getInstance()
        await registry.load()

        // Use GENERIC family to get default variant
        const variant = registry.getVariantMetadata(ModelFamily.GENERIC)
        if (!variant) {
            Logger.warn(`[CaretJsonAdapter] ⚠️ No variant found for GENERIC family`)
            return null
        }

        // Call Cline's getUserInstructions with the context
        // This will include .caretrules, .clinerules, etc. based on priority
        const userInstructions = await getUserInstructions(variant, context as any)

        if (userInstructions) {
            Logger.info(`[CaretJsonAdapter] ✅ Loaded Cline user instructions (${userInstructions.length} chars)`)
        } else {
            Logger.info(`[CaretJsonAdapter] ℹ️ No Cline user instructions found`)
        }

        return userInstructions || null
    } catch (error) {
        Logger.error(`[CaretJsonAdapter] ❌ Error loading Cline user instructions:`, error)
        return null
    }
}
```

**2) CaretJsonAdapter.ts 수정 - CARET_USER_INSTRUCTIONS 처리 변경**:
```typescript
// CARET MODIFICATION: Use Cline's actual user instructions system for CARET_USER_INSTRUCTIONS
if (name === "CARET_USER_INSTRUCTIONS") {
    const clineUserInstructions = await this.getClineUserInstructions(context, isChatbotMode)
    if (clineUserInstructions) {
        promptParts.push(clineUserInstructions)
        Logger.debug(`[CaretJsonAdapter] ✅ ${name}: loaded from Cline system (${clineUserInstructions.length} chars)`)
    } else {
        // Fallback to JSON template if Cline system fails
        const sectionContent = this.getDynamicSection(template, isChatbotMode, context)
        if (sectionContent.trim()) {
            promptParts.push(sectionContent)
            Logger.debug(`[CaretJsonAdapter] ✅ ${name}: loaded from JSON template (${sectionContent.length} chars)`)
        } else {
            Logger.debug(`[CaretJsonAdapter] ⚠️ ${name}: empty content`)
        }
    }
}
```

**3) Import 경로를 path alias로 수정**:
```typescript
// Before (상대 경로)
import { ClineToolSet } from "../../../../../src/core/prompts/system-prompt/registry/ClineToolSet"

// After (path alias)
import { ClineToolSet } from "@core/prompts/system-prompt/registry/ClineToolSet"
import { Logger } from "@services/logging/Logger"
import { ModelFamily } from "@shared/prompts"
```

**수정 파일**:
- `caret-src/core/prompts/system/adapters/CaretJsonAdapter.ts:1-6, 68-83, 133-168`

**핵심 원칙**: Caret 프롬프트 시스템도 **Cline의 규칙 시스템을 직접 호출**하여 JSON 템플릿과 실제 규칙을 모두 활용

---

## 🔄 동작 방식

### 자동 우선순위 적용

**시나리오 1: .caretrules 존재**
```
.caretrules (활성화) → AI 프롬프트에 포함 ✅
.clinerules (자동 비활성화)
.cursorrules (자동 비활성화)
→ .caretrules 내용만 AI에게 전달
```

**시나리오 2: .clinerules만 존재**
```
.caretrules (없음)
.clinerules (활성화) → AI 프롬프트에 포함 ✅
.cursorrules (자동 비활성화)
→ .clinerules 내용만 AI에게 전달
```

**시나리오 3: 규칙 없음**
```
모든 규칙 파일 없음
→ AI 프롬프트에 추가 내용 없음
```

---

## 📊 파일 확장자 지원

### 지원되는 확장자
`.caretrules` 디렉토리는 **모든 파일 확장자**를 읽어옵니다:
- `.md` - Markdown 규칙 파일
- `.json` - JSON 형식 규칙
- `.yaml`, `.yml` - YAML 형식 규칙
- 기타 텍스트 파일

### 구현 방식
```typescript
// readDirectory는 확장자 필터링 없이 모든 파일 반환
const rulesFilePaths = await readDirectory(caretRulesFilePath, [
    [path.basename(GlobalFileNames.caretRules), "workflows"],
])
```

---

## 📝 수정된 파일 목록 (전체)

### Phase 4 (초기 구현)
```
src/core/context/instructions/user-instructions/external-rules.ts  (+151 lines)
src/core/storage/disk.ts                                           (CARET MODIFICATION)
src/core/storage/state-keys.ts                                     (CARET MODIFICATION)
src/core/storage/utils/state-helpers.ts                            (CARET MODIFICATION)
```

### 2025-10-15 버그 수정
```
src/core/context/instructions/user-instructions/external-rules.ts:95-132      (우선순위 로직 수정 - 치명적)
src/core/context/instructions/user-instructions/external-rules.ts:53-56       (확장자 필터 수정)
src/core/context/instructions/user-instructions/rule-helpers.ts:169-207       (규칙 생성 위치 수정)
src/core/controller/file/createRuleFile.ts:57-59                              (토글 업데이트 추가)
src/core/controller/file/refreshRules.ts:19-35                                (반환값 수정)
src/core/task/index.ts:17, 1343-1359, 1387                                    (AI 프롬프트 통합 - Cline)
src/core/prompts/system-prompt/types.ts:100                                   (타입 정의 추가)
src/core/prompts/system-prompt/components/user_instructions.ts:15, 38, 53-55 (프롬프트 빌더 수정)
caret-src/core/prompts/system/adapters/CaretJsonAdapter.ts:1-6, 68-83, 133-168 (AI 프롬프트 통합 - Caret)
caret-src/__tests__/rule-discovery.test.ts:6                                  (테스트 수정)
```

**총 수정 파일**: 13개 (Phase 4: 4개 + 버그 수정: 10개, Cline 원본: 8개, Caret 확장: 2개)

---

## 🧪 검증

### 테스트 시나리오

**1. 우선순위 검증**
```bash
# .caretrules 생성 → 다른 규칙 자동 비활성화
mkdir .caretrules
echo "# Test rule" > .caretrules/test.md
# 프롬프트 확인: .caretrules 내용만 포함 ✅
```

**2. 파일 확장자 검증**
```bash
# JSON, YAML 파일도 로딩되는지 확인
echo '{"rule": "test"}' > .caretrules/config.json
echo 'rule: test' > .caretrules/config.yaml
# 프롬프트 확인: 모든 파일 내용 포함 ✅
```

**3. 동적 전환 검증**
```bash
# .caretrules 삭제 → .clinerules 자동 활성화
rm -rf .caretrules
# 프롬프트 확인: .clinerules 내용만 포함 ✅
```

---

## ⚙️ 설정

### 자동 감지
- 파일 시스템 변경 감지
- 우선순위 자동 적용
- 수동 설정 불필요

### 디버깅
```typescript
// Logger.debug 메시지로 상태 확인
Logger.debug(`[CARET] Rules path: ${localCaretRulesFilePath}`)
Logger.debug(`[CARET] Current toggles: ${JSON.stringify(localCaretRulesToggles)}`)
Logger.debug(`[CARET] Updated toggles: ${JSON.stringify(updatedLocalCaretToggles)}`)
```

---

## 💡 핵심 장점

**1. 토큰 절약**
- 중복 규칙 제거 → 토큰 사용량 감소
- 프롬프트 간결화 → API 비용 절감

**2. 설정 충돌 방지**
- 단일 규칙만 적용
- 우선순위 명확
- 예측 가능한 동작

**3. 최소 침습**
- Cline 코드 보존
- 12개 파일만 수정
- CARET MODIFICATION 명시

**4. 브랜드별 자동 지원**
- Caret: `.caretrules`
- CodeCenter: `.codecenterrules`
- 동적 디렉토리 전환

---

## 🔍 Known Issues (해결됨)

### ✅ 2025-10-15 버그 수정 (총 7개)
1. **우선순위 로직 오류** ⚠️ 치명적: `cloneToggles()` 복사로 인한 토글-내용 불일치 → **해결**: 각 소스가 자신의 토글만 유지
2. **파일 감지 안됨**: `"*.*"` 필터 문제 → **해결**: 빈 문자열 사용
3. **규칙 생성 위치 오류**: 하드코딩된 `.clinerules` → **해결**: 브랜드별 동적 경로
4. **토글 업데이트 누락**: refresh 미호출 → **해결**: `refreshExternalRulesToggles` 추가
5. **UI 반영 안됨**: 반환값 누락 → **해결**: `caretLocalToggles` 반환 추가
6. **Cline AI 프롬프트 누락** ⚠️ 치명적: `getLocalCaretRules` 미호출 → **해결**: Cline 프롬프트 체인 전체 통합
7. **Caret AI 프롬프트 누락** ⚠️ 치명적: `CaretJsonAdapter`가 JSON 템플릿만 사용 → **해결**: Cline 규칙 시스템 직접 호출

### ✅ 현재 상태
모든 버그 수정 완료. 정상 작동.

**가장 치명적이었던 버그 3개**:
- **버그 1**: UI에는 `.caretrules` 활성화로 표시되지만 AI는 아무것도 받지 못함
- **버그 6**: Cline 프롬프트에서 규칙 내용이 AI에게 전달 안됨
- **버그 7**: Caret 프롬프트에서 규칙 시스템을 완전히 무시함 (JSON 템플릿만 사용)

---

**작성일**: 2025-10-10 (초기) / 2025-10-15 (버그 수정)
**Phase**: Phase 4 Backend 완료 + 버그 수정 완료
**다음 단계**: 프로덕션 검증 및 모니터링
