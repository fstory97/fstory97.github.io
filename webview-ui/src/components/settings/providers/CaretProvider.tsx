import { caretModelInfoSaneDefaults } from "@shared/api"
import { Mode } from "@shared/storage/types"
import { VSCodeCheckbox, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { useState } from "react"
import { t } from "@/caret/utils/i18n"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { getAsVar, VSC_DESCRIPTION_FOREGROUND } from "@/utils/vscStyles"
import { DebouncedTextField } from "../common/DebouncedTextField"
import { ModelInfoView } from "../common/ModelInfoView"
import ThinkingBudgetSlider from "../ThinkingBudgetSlider"
import { getModeSpecificFields, normalizeApiConfiguration } from "../utils/providerUtils"
import { useApiConfigurationHandlers } from "../utils/useApiConfigurationHandlers"

/**
 * Props for the CaretProvider component
 */
interface CaretProviderProps {
	showModelOptions: boolean
	isPopup?: boolean
	currentMode: Mode
}

/**
 * The Caret provider configuration component
 */
export const CaretProvider = ({ showModelOptions, isPopup, currentMode }: CaretProviderProps) => {
	const { apiConfiguration } = useExtensionState()
	const { handleFieldChange, handleModeFieldChange } = useApiConfigurationHandlers()

	// Get the normalized configuration
	const { selectedModelId, selectedModelInfo } = normalizeApiConfiguration(apiConfiguration, currentMode)

	// Get mode-specific fields
	const { caretModelId, caretModelInfo } = getModeSpecificFields(apiConfiguration, currentMode)

	// Local state for collapsible model configuration section
	const [modelConfigurationSelected, setModelConfigurationSelected] = useState(false)

	return (
		<div>
			<DebouncedTextField
				initialValue={apiConfiguration?.caretBaseUrl || ""}
				onChange={(value) => handleFieldChange("caretBaseUrl", value)}
				placeholder={t("providers.caret.baseUrlPlaceholder", "settings")}
				style={{ width: "100%" }}
				type="url">
				<span style={{ fontWeight: 500 }}>{t("baseUrlField.label", "settings")}</span>
			</DebouncedTextField>
			<DebouncedTextField
				initialValue={apiConfiguration?.caretApiKey || ""}
				onChange={(value) => handleFieldChange("caretApiKey", value)}
				placeholder={t("providers.caret.apiKeyPlaceholder", "settings")}
				style={{ width: "100%" }}
				type="password">
				<span style={{ fontWeight: 500 }}>{t("providers.caret.apiKeyLabel", "settings")}</span>
			</DebouncedTextField>
			<DebouncedTextField
				initialValue={caretModelId || ""}
				onChange={(value) =>
					handleModeFieldChange({ plan: "planModeCaretModelId", act: "actModeCaretModelId" }, value, currentMode)
				}
				placeholder={t("providers.caret.modelIdPlaceholder", "settings")}
				style={{ width: "100%" }}>
				<span style={{ fontWeight: 500 }}>{t("providers.caret.modelIdLabel", "settings")}</span>
			</DebouncedTextField>

			<div style={{ display: "flex", flexDirection: "column", marginTop: 10, marginBottom: 10 }}>
				{selectedModelInfo.supportsPromptCache && (
					<>
						<VSCodeCheckbox
							checked={apiConfiguration?.caretUsePromptCache || false}
							onChange={(e: any) => {
								const isChecked = e.target.checked === true

								handleFieldChange("caretUsePromptCache", isChecked)
							}}
							style={{ fontWeight: 500, color: "var(--vscode-charts-green)" }}>
							{t("providers.caret.usePromptCachingLabel", "settings")}
						</VSCodeCheckbox>
						<p style={{ fontSize: "12px", marginTop: 3, color: "var(--vscode-charts-green)" }}>
							{t("providers.caret.usePromptCachingDescription", "settings")}
						</p>
					</>
				)}
			</div>

			<ThinkingBudgetSlider currentMode={currentMode} />
			<p
				style={{
					fontSize: "12px",
					marginTop: "5px",
					color: "var(--vscode-descriptionForeground)",
				}}>
				{t("providers.caret.extendedThinkingDescription1", "settings")}{" "}
				<VSCodeLink
					href="https://docs.caret.ai/docs/reasoning_content"
					style={{ display: "inline", fontSize: "inherit" }}>
					{t("providers.caret.extendedThinkingLink", "settings")}
				</VSCodeLink>
			</p>

			<div
				onClick={() => setModelConfigurationSelected((val) => !val)}
				style={{
					color: getAsVar(VSC_DESCRIPTION_FOREGROUND),
					display: "flex",
					margin: "10px 0",
					cursor: "pointer",
					alignItems: "center",
				}}>
				<span
					className={`codicon ${modelConfigurationSelected ? "codicon-chevron-down" : "codicon-chevron-right"}`}
					style={{
						marginRight: "4px",
					}}></span>
				<span
					style={{
						fontWeight: 700,
						textTransform: "uppercase",
					}}>
					{t("providers.caret.modelConfigurationLabel", "settings")}
				</span>
			</div>
			{modelConfigurationSelected && (
				<>
					<VSCodeCheckbox
						checked={!!caretModelInfo?.supportsImages}
						onChange={(e: any) => {
							const isChecked = e.target.checked === true
							const modelInfo = caretModelInfo ? caretModelInfo : { ...caretModelInfoSaneDefaults }
							modelInfo.supportsImages = isChecked

							handleModeFieldChange(
								{ plan: "planModeCaretModelInfo", act: "actModeCaretModelInfo" },
								modelInfo,
								currentMode,
							)
						}}>
						{t("providers.caret.supportsImagesLabel", "settings")}
					</VSCodeCheckbox>
					<div style={{ display: "flex", gap: 10, marginTop: "5px" }}>
						<DebouncedTextField
							initialValue={
								caretModelInfo?.contextWindow
									? caretModelInfo.contextWindow.toString()
									: (caretModelInfoSaneDefaults.contextWindow?.toString() ?? "")
							}
							onChange={(value) => {
								const modelInfo = caretModelInfo ? caretModelInfo : { ...caretModelInfoSaneDefaults }
								modelInfo.contextWindow = Number(value)

								handleModeFieldChange(
									{ plan: "planModeCaretModelInfo", act: "actModeCaretModelInfo" },
									modelInfo,
									currentMode,
								)
							}}
							style={{ flex: 1 }}>
							<span style={{ fontWeight: 500 }}>{t("providers.caret.contextWindowSizeLabel", "settings")}</span>
						</DebouncedTextField>
						<DebouncedTextField
							initialValue={
								caretModelInfo?.maxTokens
									? caretModelInfo.maxTokens.toString()
									: (caretModelInfoSaneDefaults.maxTokens?.toString() ?? "")
							}
							onChange={(value) => {
								const modelInfo = caretModelInfo ? caretModelInfo : { ...caretModelInfoSaneDefaults }
								modelInfo.maxTokens = Number(value)

								handleModeFieldChange(
									{ plan: "planModeCaretModelInfo", act: "actModeCaretModelInfo" },
									modelInfo,
									currentMode,
								)
							}}
							style={{ flex: 1 }}>
							<span style={{ fontWeight: 500 }}>{t("providers.caret.maxOutputTokensLabel", "settings")}</span>
						</DebouncedTextField>
					</div>
					<div style={{ display: "flex", gap: 10, marginTop: "5px" }}>
						<DebouncedTextField
							initialValue={
								caretModelInfo?.temperature !== undefined
									? caretModelInfo.temperature.toString()
									: (caretModelInfoSaneDefaults.temperature?.toString() ?? "")
							}
							onChange={(value) => {
								const modelInfo = caretModelInfo ? caretModelInfo : { ...caretModelInfoSaneDefaults }

								// Check if the input ends with a decimal point or has trailing zeros after decimal
								const _shouldPreserveFormat = value.endsWith(".") || (value.includes(".") && value.endsWith("0"))

								modelInfo.temperature = value === "" ? caretModelInfoSaneDefaults.temperature : parseFloat(value)

								handleModeFieldChange(
									{ plan: "planModeCaretModelInfo", act: "actModeCaretModelInfo" },
									modelInfo,
									currentMode,
								)
							}}>
							<span style={{ fontWeight: 500 }}>{t("providers.caret.temperatureLabel", "settings")}</span>
						</DebouncedTextField>
					</div>
				</>
			)}
			<p
				style={{
					fontSize: "12px",
					marginTop: "5px",
					color: "var(--vscode-descriptionForeground)",
				}}>
				{t("providers.caret.description1", "settings")}{" "}
				<VSCodeLink href="https://docs.caret.ai/docs/" style={{ display: "inline", fontSize: "inherit" }}>
					{t("providers.caret.quickstartGuideLink", "settings")}
				</VSCodeLink>{" "}
				{t("providers.caret.description2", "settings")}
			</p>

			{showModelOptions && (
				<ModelInfoView isPopup={isPopup} modelInfo={selectedModelInfo} selectedModelId={selectedModelId} />
			)}
		</div>
	)
}
