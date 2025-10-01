import { useCallback, useEffect, useState } from "react"

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
