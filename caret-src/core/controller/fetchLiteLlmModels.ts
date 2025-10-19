import { Logger } from "@services/logging/Logger"
import * as proto from "@shared/proto"
import axios from "axios"
import { Controller } from "@/core/controller"

/**
 * CARET MODIFICATION: Fetches available models from LiteLLM /v1/models endpoint
 * This endpoint returns only models assigned to the provided API key with health check OK
 * @param controller The controller instance
 * @param request The request containing base URL and API key
 * @returns Response with model names or error
 */
export async function fetchLiteLlmModels(
	_controller: Controller,
	request: proto.caret.FetchLiteLlmModelsRequest,
): Promise<proto.caret.FetchLiteLlmModelsResponse> {
	try {
		Logger.debug(`[CaretSystemService] 🎯 Fetching LiteLLM models from ${request.baseUrl}`)

		// Validate base URL
		if (!request.baseUrl) {
			Logger.warn("[CaretSystemService] ⚠️ Base URL is required")
			return proto.caret.FetchLiteLlmModelsResponse.create({
				success: false,
				models: [],
				errorMessage: "Base URL is required",
			})
		}

		if (!URL.canParse(request.baseUrl)) {
			Logger.warn(`[CaretSystemService] ⚠️ Invalid base URL format: ${request.baseUrl}`)
			return proto.caret.FetchLiteLlmModelsResponse.create({
				success: false,
				models: [],
				errorMessage: "Invalid base URL format",
			})
		}

		// Prepare headers
		const headers: Record<string, string> = {
			accept: "application/json",
		}
		// Only add API key header if it's provided and not empty
		if (request.apiKey && request.apiKey.trim() !== "") {
			// LiteLLM requires x-litellm-api-key header for API key authentication
			headers["x-litellm-api-key"] = request.apiKey
		}

		// Call LiteLLM /v1/models endpoint with query parameters
		// These parameters filter out unnecessary data and return only accessible models
		const baseUrl = request.baseUrl.replace(/\/$/, "")
		const modelsUrl = `${baseUrl}/v1/models?return_wildcard_routes=false&include_model_access_groups=false&only_model_access_groups=false&include_metadata=false`
		Logger.debug(`[CaretSystemService] 🔍 Calling /v1/models endpoint: ${modelsUrl}`)

		const response = await axios.get(modelsUrl, {
			headers,
			timeout: 10000, // 10 second timeout
		})

		// Extract model IDs from /v1/models response
		const modelsData = response.data?.data || []
		Logger.debug(`[CaretSystemService] 📋 Models response received with ${modelsData.length} models`)

		// Extract model IDs (these are already filtered by API key and health check)
		const modelNames = modelsData
			.map((model: any) => model.id)
			.filter((id: string) => id && typeof id === "string")
			.sort()

		Logger.info(`[CaretSystemService] ✅ Successfully fetched ${modelNames.length} LiteLLM models: ${modelNames.join(", ")}`)

		return proto.caret.FetchLiteLlmModelsResponse.create({
			success: true,
			models: modelNames,
		})
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
		Logger.error(`[CaretSystemService] ❌ Failed to fetch LiteLLM models from ${request.baseUrl}: ${errorMessage}`)

		return proto.caret.FetchLiteLlmModelsResponse.create({
			success: false,
			models: [],
			errorMessage: `Failed to fetch models: ${errorMessage}`,
		})
	}
}

// CARET MODIFICATION: Export with PascalCase name for generated code compatibility
export const FetchLiteLlmModels = fetchLiteLlmModels
