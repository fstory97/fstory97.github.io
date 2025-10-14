# 5차 피드백 근본 원인 분석 및 수정 계획

**작성일**: 2025-10-13 12:30
**상태**: 🔍 분석 진행 중

---

## 📋 문제 목록 (총 20개)

### 1. 초기화 후 - 첫 페이지 (4개)
- [ ] **1.1** 캐럿 로고 배너 엑스박스, 링크 깨짐
- [ ] **1.2** UI언어 설정 - 4개국어 상위, 아이콘 누락
- [ ] **1.3** 제공자 설정 클릭 무반응
- [ ] **1.4** 오픈라우터 모델 설명/단위 번역 누락

### 2. 홈 (5개)
- [ ] **2.1** 페르소나 이미지 아닌 앱로고 (🔴 **3차 반복**)
- [ ] **2.2** 공지사항 Cline 내용
- [ ] **2.3** 하단 버튼 번역 누락 (auto-approve, enabled 등)
- [ ] **2.4** 룰 페르소나 이미지/설정 누락 (🔴 **3차 반복**)
- [ ] **2.5** 하단 모델 버튼 무반응

### 3. 설정 (11개)
#### 탭 순서
- [ ] **3.0** 탭 순서 및 아이콘이 Cline과 다름

#### API 설정 탭
- [ ] **3.1** API제공자 클릭 반응 없음 (= 1.3)
- [ ] **3.2** 모델 정보 번역 누락 (= 1.4)

#### 기능 탭
- [ ] **3.3** 포커스 체인 영역 누락 + 다국어 번역
- [ ] **3.4** enable dictation, auto compact, yolo mode 누락 + 다국어

#### 일반 설정 탭
- [ ] **3.5** 캐럿/클라인 모드 토글 무반응
- [ ] **3.6** 페르소나 시스템 활성화 체크박스 누락

#### 정보 탭
- [ ] **3.7** 영문으로 나옴, 공지사항 4개국어 번역 필요

---

## 📐 실제 머징 전략 (사용자 확인)

### 프론트엔드 머징 전략
```
1. Caret 프론트 복사 (기본)
   → caret-main/webview-ui/ 복사

2. Cline 변경사항 분석
   → git diff upstream/v3.31.0..upstream/v3.32.0 분석

3. Cline 변경을 Caret에 이식
   → Cline 새 기능을 Caret 파일에 추가
```

### Cline/Caret 동시 수정 파일 처리
```
예: SettingsView.tsx (Cline: 탭 구조 변경, Caret: i18n 적용)

1. Cline 최신으로 받고
   → upstream/main의 SettingsView.tsx 복사

2. Caret 수정사항 재이식
   → i18n, featureConfig 등 다시 적용
```

### 🔴 문제 지점: 재이식 불완전
```
Phase 5:
├── 1단계: Caret 복사 ✅
├── 2단계: Cline 분석 ✅
└── 3단계: Cline → Caret 이식 ⚠️ (불완전)
    ├── 일부 기능만 이식
    ├── 일부 텍스트 번역 누락
    └── 조건부 로직 누락

결과: 5차 피드백 20개 문제
```

**예시**:
```tsx
// Cline 최신 (upstream/v3.32.0)
<h2>Focus Chain Settings</h2>  // 새 기능 추가
<p>Configure focus chain behavior</p>
<input type="checkbox" /> Enable dictation

// Caret 이식 시도 (불완전)
<h2>Focus Chain Settings</h2>  // ❌ 번역 안 함
<p>Configure focus chain behavior</p>  // ❌ 번역 안 함
// ❌ Enable dictation 아예 누락

// 완전한 이식이었어야
<h2>{t('features.focusChain.title', 'settings')}</h2>
<p>{t('features.focusChain.description', 'settings')}</p>
<input type="checkbox" /> {t('features.dictation.enable', 'settings')}
```

---

## 🔍 근본 원인 분석

### 🔴 Critical: 페르소나가 계속 누락되는 이유 (2.1, 2.4)

#### 문제 2.1: 홈 화면 페르소나 이미지
**현상**: 4차 피드백에서 ChatView.tsx 복사했는데도 여전히 앱 로고

**원인 추적**:
1. **4차 수정**: ChatView.tsx를 caret-main에서 복사
2. **확인 필요**:
   - PersonaAvatar 컴포넌트가 실제로 import되었는지
   - HomeHeader에서 PersonaAvatar를 사용하는지
   - Persona state가 올바르게 전달되는지

**깊은 원인**:
- ChatView.tsx를 복사만 하고 **실제 렌더링 로직 확인 안 함**
- HomeHeader, WelcomeSection 등에서 PersonaAvatar 사용 여부 미확인
- **단순 파일 복사만으로는 통합 불가능**

#### 문제 2.4: 룰 페르소나 설정 누락
**현상**: 4차 피드백에서 ClineRulesToggleModal.tsx 복사했는데도 여전히 누락

**원인 추적**:
1. **4차 수정**: ClineRulesToggleModal.tsx를 caret-main에서 복사
2. **확인 필요**:
   - PersonaManagement 컴포넌트가 렌더링되는지
   - enablePersonaSystem 설정이 올바른지
   - Persona 버튼이 실제로 표시되는지

**깊은 원인**:
- ClineRulesToggleModal.tsx 복사만 하고 **조건부 렌더링 로직 확인 안 함**
- PersonaManagement 컴포넌트가 실제로 표시되려면 추가 조건 필요
- **파일 복사 != 기능 동작**

#### 페르소나 반복 누락 패턴
```
3차 피드백: 페르소나 누락
→ 4차 수정: 파일 복사
→ 5차 피드백: 여전히 페르소나 누락
→ 근본 원인: 파일 복사만으로는 불충분
```

**🎯 해결 방향**:
1. **파일 복사 후 런타임 검증 필수**
2. **조건부 렌더링 로직 확인**
3. **State 전달 체인 추적**
4. **브라우저 DevTools로 실제 DOM 확인**

---

### 🟡 Medium: i18n 번역 대량 누락 (1.2, 1.4, 2.3, 3.2, 3.3, 3.4, 3.7)

**패턴**: 다국어 번역이 여러 곳에서 누락

**근본 원인**:
1. **F02 i18n Feature가 부분적으로만 통합됨**
   - locales 파일은 존재
   - 하지만 일부 컴포넌트는 여전히 하드코딩된 영문 사용
2. **Cline 최신 컴포넌트를 복사할 때 i18n 적용 누락**
   - 예: 포커스 체인, dictation, auto compact 등
3. **caret-main 자체가 일부 기능의 번역 미포함**

**영향 범위**:
- WelcomeView 언어 선택
- 모델 설명/단위
- 하단 버튼 (auto-approve, enabled)
- 기능 탭 새 기능들
- 정보 탭 공지사항

---

### 🟡 Medium: Settings 탭 구조 변경 (3.0, 3.3, 3.4)

**문제**:
- 탭 순서가 Cline과 다름
- 아이콘이 상이함
- 기능 탭에 Cline 최신 기능 누락 (포커스 체인, dictation, auto compact, yolo mode)

**근본 원인**:
1. **SettingsView.tsx 구조가 Cline 최신과 다름**
   - caret-main이 Cline v3.31.0 기반
   - 현재 머징 대상이 더 최신 버전 (v3.32.x?)
2. **4차 수정에서 SettingsView.tsx를 caret-main에서 복사**
   - 하지만 caret-main 자체가 오래된 구조
3. **Cline upstream의 SettingsView를 확인 안 함**

**해결 방향**:
- Cline upstream의 SettingsView.tsx 구조 확인
- 탭 순서, 아이콘, 새 기능 모두 반영
- caret-main 업데이트 필요

---

### 🟡 Medium: Provider 선택 여전히 안 됨 (1.3, 3.1)

**문제**: 4차에서 ApiOptions.tsx 복사했는데도 Provider 클릭 시 무반응

**근본 원인**:
1. **ApiOptions.tsx 복사만으로는 부족**
   - ProviderWizard 등 관련 컴포넌트 통합 필요
   - Provider 선택 로직이 여러 파일에 분산
2. **featureConfig.enabledProviders 필터링만으로는 부족**
   - 실제 클릭 이벤트 핸들러가 동작해야 함
   - State 관리 로직 확인 필요

---

### 🟡 Medium: 모드 시스템 무반응 (3.5)

**문제**: 캐럿/클라인 모드 토글 클릭 무반응

**근본 원인**:
1. **GeneralSection에 모드 토글 UI는 있지만 이벤트 핸들러 미연결**
2. **CaretSystemServiceClient 호출 누락**
3. **Backend SetPromptSystemMode 핸들러 확인 필요**

---

### 🟢 Low: 기타 UI 누락 (1.1, 2.2, 2.5, 3.6, 3.7)

**1.1 캐럿 로고 배너 엑스박스**:
- WelcomeView의 배너 이미지 경로 문제
- Backend에서 불러오는 방식 확인 필요

**2.2 공지사항 Cline 내용**:
- Announcement 컴포넌트 내용이 Cline 것
- Caret 버전의 공지사항으로 교체 필요

**2.5 하단 모델 버튼 무반응**:
- Model Selector 클릭 이벤트 미연결
- showModelSelector state 확인 필요

**3.6 페르소나 시스템 활성화 체크박스 누락**:
- GeneralSection에 체크박스 UI 자체가 없음
- caret-main 확인 후 추가 필요

---

## 📊 문제 분류 및 우선순위

### Priority 1: Critical (즉시 수정)
1. **페르소나 반복 누락** (2.1, 2.4)
   - 원인: 파일 복사 != 기능 동작
   - 해결: 런타임 검증 + 조건부 로직 확인

2. **Provider 선택 무반응** (1.3, 3.1)
   - 원인: 관련 컴포넌트 부분 통합
   - 해결: ProviderWizard 등 전체 통합

### Priority 2: High (오늘 수정)
3. **Settings 탭 구조** (3.0, 3.3, 3.4)
   - 원인: caret-main이 오래된 버전
   - 해결: Cline upstream 최신 구조 반영

4. **모드 시스템 무반응** (3.5)
   - 원인: 이벤트 핸들러 미연결
   - 해결: CaretSystemServiceClient 연결

### Priority 3: Medium (내일)
5. **i18n 대량 누락** (1.2, 1.4, 2.3, 3.2, 3.7)
   - 원인: F02 부분 통합
   - 해결: 누락된 번역 키 추가

6. **기타 UI** (1.1, 2.2, 2.5, 3.6)
   - 개별 수정

---

## ✅ 개선된 재이식 프로세스

### Step-by-Step: Cline 변경 → Caret 재이식

#### 파일 분류
```
1. Caret만 수정 (Cline 변경 없음)
   → caret-main 그대로 복사
   예: 새로 추가된 Caret 컴포넌트

2. Cline만 변경 (Caret 수정 없음)
   → Cline 변경사항만 이식
   예: Cline 버그 수정, 성능 개선

3. Cline + Caret 동시 수정 ⚠️
   → Cline 최신 받고 + Caret 재이식 (가장 어려움)
   예: SettingsView (Cline: 탭 구조, Caret: i18n)
```

#### 재이식 체크리스트 (3번 케이스)

**Step 1: Cline 변경사항 완전 파악**
```bash
# Diff 분석
git diff upstream/v3.31.0..upstream/v3.32.0 -- \
  webview-ui/src/components/settings/SettingsView.tsx

# 변경사항 목록 작성
- [ ] 탭 순서 변경: API > 기능 > ... (7개)
- [ ] 탭 아이콘 변경: <Setting /> → <Gear />
- [ ] FeaturesSection 새 항목: focusChain, dictation, autoCompact, yoloMode
- [ ] ... (모든 변경사항 나열)
```

**Step 2: Caret 수정사항 완전 파악**
```bash
# caret-main과 비교
diff webview-ui/src/components/settings/SettingsView.tsx \
     caret-main/webview-ui/src/components/settings/SettingsView.tsx

# Caret 수정사항 목록 작성
- [ ] import { t } from '@/caret/utils/i18n'
- [ ] 모든 텍스트 t() 변환 (50+ 곳)
- [ ] featureConfig 조건부 렌더링
- [ ] CaretGeneralSection 추가
- [ ] ... (모든 수정사항 나열)
```

**Step 3: Cline 최신 복사**
```bash
cp upstream-clone/webview-ui/src/components/settings/SettingsView.tsx \
   webview-ui/src/components/settings/
```

**Step 4: Caret 수정사항 재이식 (체크리스트 기반)**
```tsx
// [ ] import 추가
import { t } from '@/caret/utils/i18n'
import { useCaretI18nContext } from '@/caret/context/CaretI18nContext'

// [ ] 텍스트 1: 탭 타이틀
- <h2>Settings</h2>
+ <h2>{t('settings.title', 'settings')}</h2>

// [ ] 텍스트 2: API 탭
- <Tab>API Configuration</Tab>
+ <Tab>{t('settings.tabs.api', 'settings')}</Tab>

// ... (체크리스트 모든 항목 하나씩 적용)

// [ ] featureConfig 조건부 렌더링
{featureConfig.enablePersonaSystem && (
  <CaretGeneralSection />
)}

// [ ] 새 Cline 기능에도 i18n 적용
- <h3>Focus Chain</h3>
+ <h3>{t('features.focusChain.title', 'settings')}</h3>
```

**Step 5: 번역 키 추가**
```json
// locales/ko/settings.json
{
  "features": {
    "focusChain": {
      "title": "포커스 체인",
      "description": "포커스 체인 동작 설정"
    },
    "dictation": {
      "enable": "음성 인식 활성화"
    }
  }
}
```

**Step 6: 검증 (철저히)**
```bash
# 컴파일
npm run compile

# F5 실행
# Settings 탭 모두 확인:
- [ ] 탭 순서 올바른지 (API > 기능 > ...)
- [ ] 탭 아이콘 표시되는지
- [ ] 모든 텍스트 한국어로 표시되는지
- [ ] 새 기능 (focusChain, dictation) 표시되는지
- [ ] featureConfig 조건부 렌더링 동작하는지

# Screenshot 첨부 (3장 이상)
- Settings 전체
- 기능 탭 (새 기능 표시)
- General 탭 (Caret 설정)
```

**Step 7: 문서화**
```markdown
### SettingsView.tsx 재이식 완료

**Cline 변경사항** (4개):
- [x] 탭 순서 변경
- [x] 탭 아이콘 변경
- [x] FeaturesSection 새 항목 4개
- [x] 버그 수정 2개

**Caret 재이식** (50개):
- [x] i18n import
- [x] 텍스트 t() 변환 (50+ 곳)
- [x] featureConfig 조건부
- [x] 새 기능에도 i18n 적용

**번역 추가**:
- [x] settings.json (20+ 키)
- [x] 4개국어 모두

**검증**:
- [x] 컴파일 0 errors
- [x] F5 실행
- [x] 모든 탭 확인
- [x] Screenshot 첨부 (3장)
```

---

## 🔧 수정 계획

### Phase 1: 페르소나 완전 통합 (2-3시간)
**목표**: 페르소나 반복 누락 근절

**Step 1.1: 홈 화면 페르소나 (2.1)**
- [ ] HomeHeader에서 PersonaAvatar 사용 확인
- [ ] Persona state 전달 체인 추적
- [ ] DevTools로 실제 렌더링 확인
- [ ] 안 보이면 조건부 로직 수정

**Step 1.2: 룰 페르소나 설정 (2.4)**
- [ ] ClineRulesToggleModal에서 PersonaManagement 렌더링 확인
- [ ] enablePersonaSystem 설정 확인
- [ ] 조건부 렌더링 로직 수정

**Step 1.3: 런타임 검증 프로토콜 수립**
- [ ] 파일 복사 후 반드시 F5 실행
- [ ] DevTools로 컴포넌트 렌더링 확인
- [ ] State 값 console.log로 확인

---

### Phase 2: Settings 탭 구조 재작업 (3-4시간)
**목표**: Cline 최신 구조로 완전 동기화

**Step 2.1: Cline upstream 확인**
- [ ] Cline v3.32.x의 SettingsView.tsx 구조 확인
- [ ] 탭 순서: API > 기능 > 브라우저 > 터미널 > 일반 > 디버그 > 정보
- [ ] 각 탭 아이콘 확인

**Step 2.2: 기능 탭 전체 재작업 (3.3, 3.4)**
- [ ] FeaturesSection 최신 버전 복사 또는 병합
- [ ] 포커스 체인 영역 추가
- [ ] enable dictation, auto compact, yolo mode 추가
- [ ] F02 i18n 규칙에 따라 번역 키 추가
  - settings.json에 키 추가
  - 4개국어 모두 번역

**Step 2.3: 일반 탭 수정 (3.5, 3.6)**
- [ ] 모드 시스템 토글 이벤트 연결
  - CaretSystemServiceClient.SetPromptSystemMode 호출
- [ ] 페르소나 시스템 활성화 체크박스 추가
  - caret-main GeneralSection 확인 후 추가

---

### Phase 3: Provider 선택 완전 통합 (2-3시간)
**목표**: Provider 클릭 시 정상 동작

**Step 3.1: 관련 파일 전체 확인**
- [ ] ApiOptions.tsx (이미 복사됨)
- [ ] ProviderWizard.tsx 확인
- [ ] ModelSelector 관련 파일 확인

**Step 3.2: 이벤트 핸들러 추적**
- [ ] Provider 클릭 시 어떤 함수 호출되는지
- [ ] State 변경 로직 확인
- [ ] Console 에러 확인

**Step 3.3: 디버깅 및 수정**
- [ ] 문제 파일 식별
- [ ] caret-main과 비교
- [ ] 수정 또는 재복사

---

### Phase 4: i18n 누락 수정 (2-3시간)
**목표**: 모든 UI 요소 다국어 번역

**Step 4.1: 번역 키 추가**
- [ ] settings.json에 누락된 키 추가:
  - `features.focusChain.*`
  - `features.dictation.*`
  - `features.autoCompact.*`
  - `features.yoloMode.*`
  - `buttons.autoApprove`
  - `buttons.enabled`
  - `models.description.*`
  - `models.pricing.*`

**Step 4.2: 4개국어 번역**
- [ ] ko.json
- [ ] en.json
- [ ] ja.json
- [ ] zh.json

**Step 4.3: 컴포넌트에 적용**
- [ ] 하드코딩된 텍스트 → t() 함수로 교체
- [ ] 모델 설명/단위 번역 적용

---

### Phase 5: 기타 UI 수정 (1-2시간)

**Step 5.1: WelcomeView 로고 배너 (1.1)**
- [ ] caret-main WelcomeView 배너 로직 확인
- [ ] Backend 이미지 로딩 방식 확인
- [ ] 경로 수정

**Step 5.2: 공지사항 (2.2, 3.7)**
- [ ] Caret 버전 공지사항 작성
- [ ] 4개국어 번역
- [ ] Announcement 컴포넌트에 적용

**Step 5.3: 모델 버튼 (2.5)**
- [ ] Model Selector 클릭 이벤트 확인
- [ ] showModelSelector state 연결

**Step 5.4: 언어 선택 UI (1.2)**
- [ ] 4개국어 상위 표시 로직 확인
- [ ] 아이콘 추가

---

## 🎯 머징 가이드 개선 사항

### v1.2 업데이트 예정

#### 1. 파일 복사 != 기능 동작
```markdown
### 🔴 CRITICAL: 파일 복사 후 런타임 검증 필수

**잘못된 프로세스**:
1. caret-main에서 파일 복사
2. 컴파일 성공
3. ✅ 완료로 체크

**올바른 프로세스**:
1. caret-main에서 파일 복사
2. 컴파일 성공
3. **F5로 Extension 실행**
4. **DevTools로 컴포넌트 렌더링 확인**
5. **실제 동작 확인 (클릭, State 변경 등)**
6. ✅ 완료로 체크
```

#### 2. caret-main 버전 확인
```markdown
### Phase 0: caret-main 버전 확인

**문제**: caret-main이 오래된 Cline 버전 기반일 수 있음

**체크리스트**:
- [ ] caret-main의 base Cline 버전 확인
- [ ] 현재 머징 대상 Cline 버전 확인
- [ ] 버전 차이가 크면 caret-main 먼저 업데이트
```

#### 3. Settings 탭 구조 검증
```markdown
### Phase 5.0: Settings 탭 구조 확인

**체크리스트**:
- [ ] Cline upstream SettingsView.tsx 구조 확인
- [ ] 탭 순서: API > 기능 > 브라우저 > 터미널 > 일반 > 디버그 > 정보
- [ ] 각 탭 아이콘 일치 확인
- [ ] 기능 탭 최신 기능 모두 포함 확인
```

#### 4. 페르소나 통합 체크리스트
```markdown
### Persona Integration Checklist

**홈 화면 (2.1)**:
- [ ] ChatView.tsx 복사
- [ ] HomeHeader에서 PersonaAvatar import 확인
- [ ] F5 실행 후 DevTools로 PersonaAvatar 렌더링 확인
- [ ] 앱 로고가 아닌 페르소나 이미지 표시 확인

**룰 메뉴 (2.4)**:
- [ ] ClineRulesToggleModal.tsx 복사
- [ ] PersonaManagement import 확인
- [ ] F5 실행 후 Rules 버튼 클릭
- [ ] Persona 설정 버튼 표시 확인
- [ ] 클릭 시 Persona 관리 화면 표시 확인
```

---

## 📝 다음 단계

### 즉시 실행
1. **Phase 1 시작**: 페르소나 완전 통합
2. **Runtime 검증**: 각 수정 후 F5 + DevTools 확인
3. **문서화**: 각 수정 내용 기록

### 완료 후
1. **5차 피드백 체크리스트 작성**
2. **merge-standard-guide.md v1.2 업데이트**
3. **6차 피드백 대기**

---

**작성자**: Luke (with Claude Code)
**작성 시각**: 2025-10-13 12:30
**예상 소요 시간**: Phase 1-5 총 10-15시간
