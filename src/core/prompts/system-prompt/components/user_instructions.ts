import { Logger } from "@/services/logging/Logger"
import { SystemPromptSection } from "../templates/placeholders"
import { TemplateEngine } from "../templates/TemplateEngine"
import type { PromptVariant, SystemPromptContext } from "../types"

const USER_CUSTOM_INSTRUCTIONS_TEMPLATE_TEXT = `USER'S CUSTOM INSTRUCTIONS

The following additional instructions are provided by the user, and should be followed to the best of your ability without interfering with the TOOL USE guidelines.

{{CUSTOM_INSTRUCTIONS}}`

export async function getUserInstructions(variant: PromptVariant, context: SystemPromptContext): Promise<string | undefined> {
	const customInstructions = buildUserInstructions(
		context.globalClineRulesFileInstructions,
		context.localClineRulesFileInstructions,
		context.localCaretRulesFileInstructions, // CARET MODIFICATION: Include .caretrules content
		context.localCursorRulesFileInstructions,
		context.localCursorRulesDirInstructions,
		context.localWindsurfRulesFileInstructions,
		context.clineIgnoreInstructions,
		context.preferredLanguageInstructions,
	)

	if (!customInstructions) {
		return undefined
	}

	const template =
		variant.componentOverrides?.[SystemPromptSection.USER_INSTRUCTIONS]?.template || USER_CUSTOM_INSTRUCTIONS_TEMPLATE_TEXT

	return new TemplateEngine().resolve(template, context, {
		CUSTOM_INSTRUCTIONS: customInstructions,
	})
}

function buildUserInstructions(
	globalClineRulesFileInstructions?: string,
	localClineRulesFileInstructions?: string,
	localCaretRulesFileInstructions?: string, // CARET MODIFICATION: Add .caretrules parameter
	localCursorRulesFileInstructions?: string,
	localCursorRulesDirInstructions?: string,
	localWindsurfRulesFileInstructions?: string,
	clineIgnoreInstructions?: string,
	preferredLanguageInstructions?: string,
): string | undefined {
	Logger.info(`[buildUserInstructions] Building AI prompt with rules:`)
	Logger.info(`[buildUserInstructions] - globalClineRules: ${globalClineRulesFileInstructions ? "YES" : "NO"}`)
	Logger.info(`[buildUserInstructions] - localCaretRules: ${localCaretRulesFileInstructions ? "YES" : "NO"}`)
	Logger.info(`[buildUserInstructions] - localClineRules: ${localClineRulesFileInstructions ? "YES" : "NO"}`)
	Logger.info(`[buildUserInstructions] - localCursorRules: ${localCursorRulesFileInstructions ? "YES" : "NO"}`)
	Logger.info(`[buildUserInstructions] - localWindsurfRules: ${localWindsurfRulesFileInstructions ? "YES" : "NO"}`)

	const customInstructions = []
	if (preferredLanguageInstructions) {
		customInstructions.push(preferredLanguageInstructions)
	}
	if (globalClineRulesFileInstructions) {
		customInstructions.push(globalClineRulesFileInstructions)
	}
	// CARET MODIFICATION: Add .caretrules content to AI prompt (highest priority for workspace rules)
	if (localCaretRulesFileInstructions) {
		Logger.info(
			`[buildUserInstructions] ✅ Adding .caretrules to AI prompt (${localCaretRulesFileInstructions.length} chars)`,
		)
		customInstructions.push(localCaretRulesFileInstructions)
	}
	if (localClineRulesFileInstructions) {
		Logger.info(
			`[buildUserInstructions] ✅ Adding .clinerules to AI prompt (${localClineRulesFileInstructions.length} chars)`,
		)
		customInstructions.push(localClineRulesFileInstructions)
	}
	if (localCursorRulesFileInstructions) {
		customInstructions.push(localCursorRulesFileInstructions)
	}
	if (localCursorRulesDirInstructions) {
		customInstructions.push(localCursorRulesDirInstructions)
	}
	if (localWindsurfRulesFileInstructions) {
		customInstructions.push(localWindsurfRulesFileInstructions)
	}
	if (clineIgnoreInstructions) {
		customInstructions.push(clineIgnoreInstructions)
	}
	if (customInstructions.length === 0) {
		Logger.warn(`[buildUserInstructions] ⚠️ No custom instructions to add to AI prompt`)
		return undefined
	}

	Logger.info(`[buildUserInstructions] ✅ Final AI prompt includes ${customInstructions.length} instruction blocks`)
	return customInstructions.join("\n\n")
}
