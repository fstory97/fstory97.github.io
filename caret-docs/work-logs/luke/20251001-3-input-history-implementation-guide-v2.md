# 구현 가이드: 채팅 입력 메시지 히스토리 기능 (v2)

## 1. 작업 목표 (2025-10-01 수정)
- 사용자가 채팅 입력창에서 위쪽/아래쪽 화살표 키를 눌렀을 때, 이전에 입력했던 메시지들을 탐색할 수 있는 기능을 구현합니다.
- **터미널과 일관된 경험**: 세션 종료 후에도 히스토리 유지, 워크스페이스별 저장
- **정확성**: AI 응답 섞임 없이 사용자 입력만 정확히 저장

## 2. 아키텍처 (v2 - 영구 저장 방식)
- **최소 침습 원칙**: Cline 원본 코드의 수정을 최소화합니다.
- **하이브리드 저장**: 메모리(현재 세션) + 영구저장(워크스페이스) 이중 구조
- **프론트엔드 전용**: 백엔드 수정 없이 VS Code Extension API 활용
- **입력 즉시 저장**: 메시지 전송 시점에 히스토리에 추가 (기존 필터링 방식 삭제)

## 3. 기존 방식 대비 변경점

### 기존 방식 (삭제 예정)
```typescript
// ChatView.tsx - 삭제할 코드
const userMessageHistory = useMemo(() => {
    return messages
        .filter((msg) => msg.type === "say" && msg.say === "user_feedback")
        .map((msg) => msg.text)
        .filter((text) => !!text)
}, [messages])
```

### 새로운 방식 (구현할 코드)
```typescript
// ChatView.tsx - 새로운 방식
const { inputHistory, addToHistory } = usePersistentInputHistory()

// 메시지 전송 시 히스토리에 추가
const handleSendMessage = (text: string, images: string[], files: string[]) => {
    addToHistory(text) // 입력 즉시 히스토리 저장
    messageHandlers.handleSendMessage(text, images, files)
}
```

## 4. 수정 대상 파일 및 내용

### 파일 1: `webview-ui/src/caret/hooks/usePersistentInputHistory.ts` (신규 생성)
```typescript
import { useState, useCallback, useEffect } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"

const MAX_HISTORY_SIZE = 1000

export function usePersistentInputHistory() {
    const { chatSettings, setChatSettings } = useExtensionState()
    const [sessionHistory, setSessionHistory] = useState<string[]>([])

    // 영구 저장된 히스토리 로드
    const persistentHistory = chatSettings.inputHistory || []

    // 통합 히스토리 (영구 + 세션)
    const combinedHistory = [...persistentHistory, ...sessionHistory]

    // 히스토리에 추가
    const addToHistory = useCallback((text: string) => {
        if (!text.trim()) return

        // 중복 제거 (마지막 항목과 같으면 추가하지 않음)
        if (combinedHistory[combinedHistory.length - 1] === text.trim()) return

        // 세션 히스토리에 추가
        setSessionHistory(prev => [...prev, text.trim()])

        // 주기적으로 영구 저장소에 저장 (세션당 10개씩 모아서)
        if (sessionHistory.length >= 10) {
            const newPersistentHistory = [...persistentHistory, ...sessionHistory, text.trim()]
                .slice(-MAX_HISTORY_SIZE) // 최대 크기 제한

            setChatSettings({
                ...chatSettings,
                inputHistory: newPersistentHistory
            })
            setSessionHistory([]) // 세션 히스토리 초기화
        }
    }, [combinedHistory, sessionHistory, persistentHistory, chatSettings, setChatSettings])

    // 세션 종료 시 남은 히스토리 저장
    useEffect(() => {
        const saveOnUnload = () => {
            if (sessionHistory.length > 0) {
                const newPersistentHistory = [...persistentHistory, ...sessionHistory]
                    .slice(-MAX_HISTORY_SIZE)
                setChatSettings({
                    ...chatSettings,
                    inputHistory: newPersistentHistory
                })
            }
        }

        window.addEventListener('beforeunload', saveOnUnload)
        return () => window.removeEventListener('beforeunload', saveOnUnload)
    }, [sessionHistory, persistentHistory, chatSettings, setChatSettings])

    return {
        inputHistory: combinedHistory,
        addToHistory
    }
}
```

### 파일 2: `webview-ui/src/caret/hooks/useInputHistory.ts` (수정)
```typescript
// 기존 코드 유지하되 history 매개변수만 사용
import { useState, useCallback, useEffect } from "react"

interface UseInputHistoryParams {
    history: string[]
    inputValue: string
    setInputValue: (value: string) => void
}

export function useInputHistory({ history, inputValue, setInputValue }: UseInputHistoryParams) {
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [currentInput, setCurrentInput] = useState("")

    useEffect(() => {
        if (historyIndex !== -1 && inputValue !== history[historyIndex]) {
            setHistoryIndex(-1)
        }
        setCurrentInput(inputValue)
    }, [inputValue, history, historyIndex])

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (history.length === 0) {
                return false
            }

            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                // 커서가 텍스트 시작/끝에 있을 때만 히스토리 탐색
                if (event.currentTarget.selectionStart === 0 || event.currentTarget.selectionStart === inputValue.length) {
                    event.preventDefault()
                } else {
                    return false
                }

                let newIndex: number
                if (event.key === "ArrowUp") {
                    newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
                } else {
                    newIndex = historyIndex === -1 ? -1 : Math.min(history.length, historyIndex + 1)
                }

                setHistoryIndex(newIndex)

                if (newIndex >= 0 && newIndex < history.length) {
                    setInputValue(history[newIndex])
                } else {
                    setInputValue(currentInput)
                    setHistoryIndex(-1)
                }
                return true
            }

            return false
        },
        [history, historyIndex, currentInput, inputValue, setInputValue],
    )

    return { handleKeyDown }
}
```

### 파일 3: `webview-ui/src/components/chat/ChatView.tsx` (수정)
```diff
--- a/webview-ui/src/components/chat/ChatView.tsx
+++ b/webview-ui/src/components/chat/ChatView.tsx
@@ -4,6 +4,7 @@
 import { useCaretI18n } from "@/caret/hooks/useCaretI18n"
+import { usePersistentInputHistory } from "@/caret/hooks/usePersistentInputHistory"

-	// CARET MODIFICATION: Filter user messages for input history functionality
-	const userMessageHistory = useMemo(() => {
-		return messages
-			.filter((msg): msg is ClineMessage & { say: "user_feedback" } => {
-				return msg.type === "say" && msg.say === "user_feedback"
-			})
-			.map((msg) => msg.text)
-			.filter((text): text is string => !!text)
-	}, [messages])

+	// CARET MODIFICATION: Persistent input history functionality
+	const { inputHistory, addToHistory } = usePersistentInputHistory()

+	// CARET MODIFICATION: Enhanced message handler with history tracking
+	const enhancedMessageHandlers = useMemo(() => ({
+		...messageHandlers,
+		handleSendMessage: (text: string, images: string[], files: string[]) => {
+			addToHistory(text) // 히스토리에 추가
+			messageHandlers.handleSendMessage(text, images, files)
+		}
+	}), [messageHandlers, addToHistory])

 				<InputSection
 					chatState={chatState}
-					messageHandlers={messageHandlers}
+					messageHandlers={enhancedMessageHandlers}
 					placeholderText={placeholderText}
 					scrollBehavior={scrollBehavior}
 					selectFilesAndImages={selectFilesAndImages}
 					shouldDisableFilesAndImages={shouldDisableFilesAndImages}
-					userMessageHistory={userMessageHistory} // CARET MODIFICATION: Pass user message history for input history
+					inputHistory={inputHistory} // CARET MODIFICATION: Pass persistent input history
 				/>
```

### 파일 4: `webview-ui/src/components/chat/chat-view/components/layout/InputSection.tsx` (수정)
```diff
--- a/webview-ui/src/components/chat/chat-view/components/layout/InputSection.tsx
+++ b/webview-ui/src/components/chat/chat-view/components/layout/InputSection.tsx
 interface InputSectionProps {
 	chatState: ChatState
 	messageHandlers: MessageHandlers
 	scrollBehavior: ScrollBehavior
 	placeholderText: string
 	shouldDisableFilesAndImages: boolean
 	selectFilesAndImages: () => Promise<void>
-	userMessageHistory?: string[] // CARET MODIFICATION: Input history functionality
+	inputHistory?: string[] // CARET MODIFICATION: Persistent input history functionality
 }

 export const InputSection: React.FC<InputSectionProps> = ({
 	chatState,
 	messageHandlers,
 	scrollBehavior,
 	placeholderText,
 	shouldDisableFilesAndImages,
 	selectFilesAndImages,
-	userMessageHistory,
+	inputHistory,
 }) => {

 				shouldDisableFilesAndImages={shouldDisableFilesAndImages}
-				userMessageHistory={userMessageHistory} // CARET MODIFICATION: Pass user message history for input history
+				inputHistory={inputHistory} // CARET MODIFICATION: Pass persistent input history
 			/>
```

### 파일 5: `webview-ui/src/components/chat/ChatTextArea.tsx` (수정)
```diff
--- a/webview-ui/src/components/chat/ChatTextArea.tsx
+++ b/webview-ui/src/components/chat/ChatTextArea.tsx
 interface ChatTextAreaProps {
 	// ... 기존 props
-	userMessageHistory?: string[] // CARET MODIFICATION: Input history functionality
+	inputHistory?: string[] // CARET MODIFICATION: Persistent input history functionality
 }

 		shouldDisableFilesAndImages,
 		onHeightChange,
 		onFocusChange,
-		userMessageHistory = [], // CARET MODIFICATION: Input history functionality
+		inputHistory = [], // CARET MODIFICATION: Persistent input history functionality
 	},
 	ref,
 ) => {

-		// CARET MODIFICATION: Input history functionality - hook for handling arrow key navigation through message history
+		// CARET MODIFICATION: Persistent input history functionality - hook for handling arrow key navigation
 		const { handleKeyDown: handleHistoryKeyDown } = useInputHistory({
-			history: userMessageHistory,
+			history: inputHistory,
 			inputValue,
 			setInputValue,
 		})
```

## 5. 테스트 시나리오
1. 채팅창에 여러 메시지를 입력하고 전송합니다.
2. 위쪽 화살표 키를 누르면 가장 최근에 입력한 메시지가 나타나는지 확인합니다.
3. VS Code 재시작 후에도 히스토리가 유지되는지 확인합니다.
4. 다른 워크스페이스에서는 다른 히스토리가 나타나는지 확인합니다.
5. 중복 메시지가 연속으로 저장되지 않는지 확인합니다.

## 6. 장점
- ✅ **정확성**: AI 응답 섞임 없음
- ✅ **즉시성**: 입력 즉시 히스토리에 추가
- ✅ **영구성**: 세션 종료 후에도 유지
- ✅ **효율성**: 필터링 연산 불필요
- ✅ **일관성**: 터미널과 같은 UX