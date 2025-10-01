import { useCallback, useEffect, useState } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"

const MAX_HISTORY_SIZE = 1000

export function usePersistentInputHistory() {
	const { inputHistory: persistentHistory, setInputHistory } = useExtensionState()
	const [sessionHistory, setSessionHistory] = useState<string[]>([])

	// 영구 저장된 히스토리 로드
	const currentPersistentHistory = persistentHistory || []

	// 통합 히스토리 (영구 + 세션)
	const combinedHistory = [...currentPersistentHistory, ...sessionHistory]

	// 히스토리에 추가
	const addToHistory = useCallback(
		(text: string) => {
			if (!text.trim()) return

			// 중복 제거 (마지막 항목과 같으면 추가하지 않음)
			if (combinedHistory[combinedHistory.length - 1] === text.trim()) return

			// 세션 히스토리에 추가
			setSessionHistory((prev) => [...prev, text.trim()])

			// 주기적으로 영구 저장소에 저장 (세션당 10개씩 모아서)
			if (sessionHistory.length >= 10) {
				const newPersistentHistory = [...currentPersistentHistory, ...sessionHistory, text.trim()].slice(
					-MAX_HISTORY_SIZE,
				) // 최대 크기 제한

				setInputHistory(newPersistentHistory)
				setSessionHistory([]) // 세션 히스토리 초기화
			}
		},
		[combinedHistory, sessionHistory, currentPersistentHistory, setInputHistory],
	)

	// 세션 종료 시 남은 히스토리 저장
	useEffect(() => {
		const saveOnUnload = () => {
			if (sessionHistory.length > 0) {
				const newPersistentHistory = [...currentPersistentHistory, ...sessionHistory].slice(-MAX_HISTORY_SIZE)
				setInputHistory(newPersistentHistory)
			}
		}

		window.addEventListener("beforeunload", saveOnUnload)
		return () => window.removeEventListener("beforeunload", saveOnUnload)
	}, [sessionHistory, currentPersistentHistory, setInputHistory])

	return {
		inputHistory: combinedHistory,
		addToHistory,
	}
}
