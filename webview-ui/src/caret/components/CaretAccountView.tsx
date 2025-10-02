// CARET MODIFICATION: Caret Account View component - replacement for ClineAccountView
// Now uses actual gRPC communication with Extension instead of Mock API

import { type CaretUsage, CaretUser } from "@shared/CaretAccount"
import * as proto from "@shared/proto/index"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { memo, useCallback } from "react"
import { caretWebviewLogger } from "@/caret/utils/CaretWebviewLogger"
import { t } from "@/caret/utils/i18n"
import { CaretAccountServiceClient } from "@/services/grpc-client"
import { formatCurrencyAmount } from "@/utils/format"

const tokenFormatter = new Intl.NumberFormat()

const formatTokenCount = (value?: number | null) => {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return "0"
	}

	return tokenFormatter.format(value)
}

const formatUsageCost = (usage?: CaretUsage | null) => {
	if (!usage) {
		return "$0.00"
	}

	const currency = usage.currency?.toUpperCase()
	const isUsd = !currency || currency === "USD"

	return `${isUsd ? "$" : `${currency} `}${formatCurrencyAmount(usage.spend)}`
}

type CaretAccountViewProps = {
	caretUser: CaretUser
}

const CaretAccountView = memo(({ caretUser }: CaretAccountViewProps) => {
	const { id, email, displayName, dailyUsage, monthlyUsage } = caretUser
	const usageRows = [
		{ key: "daily", label: t("account.dailyUsage", "common"), usage: dailyUsage },
		{ key: "monthly", label: t("account.monthlyUsage", "common"), usage: monthlyUsage },
	]

	const handleLogout = useCallback(async () => {
		caretWebviewLogger.info("[CARET-ACCOUNT-VIEW] 🚪 User logout requested via gRPC")
		try {
			// CARET MODIFICATION: Call gRPC logout
			const request: proto.cline.EmptyRequest = { metadata: undefined }
			await CaretAccountServiceClient.caretAccountLogoutClicked(request)

			caretWebviewLogger.info("[CARET-ACCOUNT-VIEW] ✅ gRPC logout successful")
		} catch (error) {
			caretWebviewLogger.error("[CARET-ACCOUNT-VIEW] ❌ gRPC logout failed:", error)
		}
	}, [])

	// Log render state
	console.log("[CARET-ACCOUNT-VIEW] 🎨 Rendering with gRPC state:", {
		user: { id, email, displayName },
		usage: {
			daily: {
				promptTokens: dailyUsage.prompt_tokens,
				completionTokens: dailyUsage.completion_tokens,
				totalTokens: dailyUsage.total_tokens,
				totalCost: dailyUsage.spend,
			},
			monthly: {
				promptTokens: monthlyUsage.prompt_tokens,
				completionTokens: monthlyUsage.completion_tokens,
				totalTokens: monthlyUsage.total_tokens,
				totalCost: monthlyUsage.spend,
			},
		},
	})

	return (
		<div className="max-w-lg mx-auto p-4">
			<div className="text-xl font-semibold mb-4 text-center text-[var(--vscode-foreground)]">
				{t("account.manageAccount", "common")}
			</div>

			<div className="bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] rounded-lg p-4 mb-4">
				<div className="space-y-1">
					<div className="text-[var(--vscode-foreground)]">
						<span className="text-[var(--vscode-descriptionForeground)]">{t("account.email", "common")}: </span>
						{email || id}
					</div>
					{displayName && (
						<div className="text-[var(--vscode-foreground)]">
							<span className="text-[var(--vscode-descriptionForeground)]">
								{t("account.displayName", "common")}:{" "}
							</span>
							{displayName}
						</div>
					)}
				</div>
			</div>

			<div className="bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] rounded-lg p-4 mb-4">
				<div className="text-sm font-semibold uppercase tracking-wide text-[var(--vscode-descriptionForeground)]">
					{t("account.usageSummary", "common")}
				</div>
				<div className="mt-3">
					<div className="grid grid-cols-3 gap-3 border-b border-[var(--vscode-panel-border)] pb-2 text-xs uppercase tracking-wide text-[var(--vscode-descriptionForeground)]">
						<div>{t("account.timeframe", "common")}</div>
						<div className="text-right">{t("account.totalTokens", "common")}</div>
						<div className="text-right">{t("account.totalCost", "common")}</div>
					</div>
					<div className="divide-y divide-[var(--vscode-panel-border)] text-sm text-[var(--vscode-foreground)]">
						{usageRows.map(({ key, label, usage }) => (
							<div className="grid grid-cols-3 gap-3 py-2" key={key}>
								<div className="font-medium">{label}</div>
								<div className="text-right">{formatTokenCount(usage?.total_tokens)}</div>
								<div className="text-right">{formatUsageCost(usage)}</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="space-y-3">
				<VSCodeButton appearance="secondary" className="w-full" onClick={handleLogout}>
					{t("account.logout", "common")}
				</VSCodeButton>
			</div>
		</div>
	)
})

CaretAccountView.displayName = "CaretAccountView"

export default CaretAccountView
