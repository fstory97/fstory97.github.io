# F12 - Claude Code Subagent Support

**상태**: 🚧 Phase 2 진행 중
**구현도**: Backend 진행 중
**우선순위**: MEDIUM - 기능 확장

---

## 📋 개요

**목표**: Claude Code의 서브에이전트(Task 도구) 기능을 Caret에서 활성화

**배경**:
- Cline v3.32.7에서 Claude Code 통합 완료 (커밋 689afc62e)
- 모든 built-in 도구가 `--disallowedTools`로 비활성화됨
- 이유: "자체 도구 시스템 사용" 철학
- **Caret의 방향**: 최소 침습 원칙으로 Task 도구만 선택적 활성화

**핵심 기능**:
- Claude Code의 Task 도구 활성화
- 서브에이전트 실행 지원
- tool_use 메시지 처리

---

## 🏗️ 구현 전략

### 최소 침습 원칙 (Minimal Invasive Approach)

**Cline 원본 수정**: 2개 파일만
1. `src/integrations/claude-code/run.ts` - Task 도구 활성화 (1줄)
2. `src/core/api/providers/claude-code.ts` - tool_use 처리 (약 10줄)

**수정 이유**:
- Cline이 의도적으로 비활성화했지만, Caret은 사용자 선택권 제공
- Task 도구는 다른 도구들과 달리 고수준 추상화
- Caret의 자체 도구 시스템과 보완적 관계

---

## 🔧 구현 상세

### 1. Task 도구 활성화

**파일**: `src/integrations/claude-code/run.ts`

**변경 전**:
```typescript
const claudeCodeTools = [
  "Task",  // ⚠️ 비활성화됨
  "Bash",
  "Glob",
  // ...
].join(",")
```

**변경 후**:
```typescript
// CARET MODIFICATION: Enable Task tool for subagent support (F12)
const claudeCodeTools = [
  // "Task",  // Caret: Keep Task tool enabled for subagent feature
  "Bash",
  "Glob",
  // ...
].join(",")
```

**설명**:
- Task를 disallowedTools에서 제거
- 주석으로 Caret 수정 명시
- 다른 도구들은 계속 비활성화 유지

---

### 2. Tool Use 처리 추가

**파일**: `src/core/api/providers/claude-code.ts`

**변경 위치**: `for await (const chunk of claudeProcess)` 루프 내, tool_use 케이스

**변경 전**:
```typescript
case "tool_use":
  console.error(`tool_use is not supported yet. Received: ${JSON.stringify(content)}`)
  break
```

**변경 후**:
```typescript
case "tool_use":
  // CARET MODIFICATION: Support Task tool for subagent feature (F12)
  yield {
    type: "tool_use",
    id: content.id,
    name: content.name,
    input: content.input,
  }
  break
```

**설명**:
- tool_use 블록을 그대로 yield
- Caret의 task execution system이 자동 처리
- Anthropic SDK 타입과 호환

---

## 📊 Task 도구 스펙

### Input (AgentInput)

```typescript
{
  description: string      // 3-5단어 작업 설명
  prompt: string           // 에이전트가 수행할 작업
  subagent_type: string    // 전문 에이전트 타입
  tools?: string[]         // 선택적 도구 목록
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit'
}
```

### Output (TaskOutput)

```typescript
{
  result: string           // 서브에이전트의 최종 결과
  usage?: {
    input_tokens: number
    output_tokens: number
    cache_creation_input_tokens?: number
    cache_read_input_tokens?: number
  }
  total_cost_usd?: number  // USD 단위 총 비용
  duration_ms?: number     // 실행 시간 (밀리초)
}
```

---

## 🔄 통합 흐름

```
User Request
    ↓
Caret AGENT Mode
    ↓
Claude Code Provider
    ↓
Claude Code CLI (Task 도구 활성화)
    ↓
Subagent Execution
    ↓
Task Result
    ↓
Caret UI Display
```

---

## 📝 Modified Files

**Core Modifications**:
```
src/integrations/claude-code/run.ts (1줄: Task 주석 처리)
src/core/api/providers/claude-code.ts (10줄: tool_use 케이스)
```

**Documentation**:
```
caret-docs/features/f12-claude-code-subagent-support.md
caret-docs/work-logs/alpha/2025-10-16-claude-code-tool-use-implementation.md
caret-docs/work-logs/alpha/2025-10-16-phase1-analysis-report.md
```

---

## 💡 핵심 장점

**1. 최소 침습**
- 2개 파일, 약 11줄 수정
- Cline 철학과 충돌 최소화
- 향후 병합 시 관리 용이

**2. 기능 확장**
- 서브에이전트로 복잡한 작업 위임
- Claude Code의 공식 기능 활용
- Task 도구의 검증된 안정성

**3. 사용자 선택권**
- Cline: 자체 도구만 사용 (단순)
- Caret: Task 도구 추가 지원 (확장)
- 사용자가 프로바이더 선택으로 결정

---

## 🧪 검증 계획

### Phase 3 테스트

**1. 기본 동작**
```typescript
// 서브에이전트 호출 테스트
"Create a detailed analysis of this codebase"
→ Claude Code가 Task 도구 사용
→ 결과 정상 반환
```

**2. 에러 처리**
```typescript
// Task 도구 실패 시
→ 에러 메시지 정상 표시
→ Caret UI에 적절히 반영
```

**3. 기존 기능 보존**
```typescript
// text, thinking 블록
→ 정상 작동 확인
→ 성능 저하 없음
```

---

## ⚠️ 주의사항

### Cline Upstream 병합

**충돌 가능 지점**:
- `src/integrations/claude-code/run.ts`
- `src/core/api/providers/claude-code.ts`

**대응 방안**:
1. CARET MODIFICATION 주석으로 명확히 표시
2. 병합 시 수동 검토 필요
3. Cline이 Task 활성화 시 자동 병합

---

## 🔮 향후 계획

### Phase 5 (선택적)

**UI 개선**:
- 서브에이전트 실행 상태 표시
- Task 결과 구분 표시
- 비용 및 토큰 사용량 상세 정보

**설정 추가**:
- Task 도구 활성화/비활성화 토글
- 서브에이전트 모델 선택
- 타임아웃 설정

---

**작성일**: 2025-10-16
**Phase**: Phase 2 진행 중
**참조**: F09 Enhanced Provider Setup
**다음 단계**: Phase 2 구현 → Phase 3 테스트
