// CARET MODIFICATION: Caret Account View component - replacement for ClineAccountView
// Now uses actual gRPC communication with Extension instead of Mock API

import { CaretUser } from "@shared/CaretAccount"
import * as proto from "@shared/proto/index"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { memo, useCallback } from "react"
import { caretWebviewLogger } from "@/caret/utils/CaretWebviewLogger"
import { t } from "@/caret/utils/i18n"
import VSCodeButtonLink from "@/components/common/VSCodeButtonLink"
import { CaretAccountServiceClient } from "@/services/grpc-client"

type CaretAccountViewProps = {
	caretUser: CaretUser
}

const CaretAccountView = memo(({ caretUser }: CaretAccountViewProps) => {
	const { id, email, displayName, spend } = caretUser
	const formattedSpend = Number.isFinite(Number(spend)) ? Number(spend).toFixed(2) : (spend ?? "0.00")

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
		user: { id, email, displayName, spend: formattedSpend },
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
					<div className="text-[var(--vscode-foreground)]">
						<span className="text-[var(--vscode-descriptionForeground)]">{t("account.spend", "common")}: </span>$
						{formattedSpend}
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
