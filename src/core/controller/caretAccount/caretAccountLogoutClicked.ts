// CARET MODIFICATION: gRPC handler for Caret account logout

import { Controller } from "@core/controller"
import * as proto from "@shared/proto/index"
import { Empty } from "@shared/proto/cline/common"

/**
 * Handles Caret account logout click
 * Clears Auth0 tokens and user state
 */
export async function caretAccountLogoutClicked(
	controller: Controller,
	_request: proto.cline.EmptyRequest,
): Promise<proto.cline.Empty> {
	console.log("[CARET-HANDLER] 🚪 Caret account logout clicked")

	try {
		// CARET MODIFICATION: Use CaretGlobalManager for Auth0 logout
		// await CaretGlobalManager.logout()
		await controller.handleCaretSignOut()
		console.log("[CARET-HANDLER] ✅ Caret logout successful")
	} catch (error) {
		console.error("[CARET-HANDLER] ❌ Caret logout failed:", error)
	}

	return Empty.create({})
}
