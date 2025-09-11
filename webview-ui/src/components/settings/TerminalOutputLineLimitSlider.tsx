import React from "react"
import { t } from "@/caret/utils/i18n"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { updateSetting } from "./utils/settingsHandlers"

const TerminalOutputLineLimitSlider: React.FC = () => {
	const { terminalOutputLineLimit } = useExtensionState()

	const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(event.target.value, 10)
		updateSetting("terminalOutputLineLimit", value)
	}

	return (
		<div style={{ marginBottom: 15 }}>
			<label htmlFor="terminal-output-limit" style={{ fontWeight: "500", display: "block", marginBottom: 5 }}>
				{t("settings.terminalOutputLineLimit.label")}
			</label>
			<div style={{ display: "flex", alignItems: "center" }}>
				<input
					id="terminal-output-limit"
					max="5000"
					min="100"
					onChange={handleSliderChange}
					step="100"
					style={{ flexGrow: 1, marginRight: "1rem" }}
					type="range"
					value={terminalOutputLineLimit ?? 500}
				/>
				<span>{terminalOutputLineLimit ?? 500}</span>
			</div>
			<p style={{ fontSize: "12px", color: "var(--vscode-descriptionForeground)", margin: "5px 0 0 0" }}>
				{t("settings.terminalOutputLineLimit.description")}
			</p>
		</div>
	)
}

export default TerminalOutputLineLimitSlider
