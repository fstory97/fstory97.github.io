import * as proto from "@shared/proto"
import axios from "axios"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Controller } from "@/core/controller"
import { fetchLiteLlmModels } from "./fetchLiteLlmModels"

// Mock axios
vi.mock("axios")
const mockedAxios = axios as any

// Mock Logger
vi.mock("@services/logging/Logger", () => ({
	Logger: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}))

describe("fetchLiteLlmModels", () => {
	const mockController = {} as Controller

	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.resetAllMocks()
	})

	it("should successfully fetch models from LiteLLM /v1/models endpoint", async () => {
		// CARET MODIFICATION: Test successful model fetching from /v1/models endpoint
		const mockModelsResponse = {
			data: {
				data: [
					{ id: "gpt-3.5-turbo", object: "model", created: 1677610602, owned_by: "openai" },
					{ id: "gpt-4", object: "model", created: 1677610602, owned_by: "openai" },
					{ id: "claude-3-sonnet", object: "model", created: 1677610602, owned_by: "anthropic" },
				],
				object: "list",
			},
		}

		mockedAxios.get.mockResolvedValueOnce(mockModelsResponse)

		const request = proto.caret.FetchLiteLlmModelsRequest.create({
			baseUrl: "https://api.litellm.com",
			apiKey: "test-key",
		})

		const result = await fetchLiteLlmModels(mockController, request)

		expect(result.success).toBe(true)
		expect(result.models).toEqual(["claude-3-sonnet", "gpt-3.5-turbo", "gpt-4"])
		expect(result.errorMessage).toBe("")
		expect(mockedAxios.get).toHaveBeenCalledWith(
			"https://api.litellm.com/v1/models?return_wildcard_routes=false&include_model_access_groups=false&only_model_access_groups=false&include_metadata=false",
			{
				headers: {
					accept: "application/json",
					"x-litellm-api-key": "test-key",
				},
				timeout: 10000,
			},
		)
	})

	it("should handle missing base URL", async () => {
		const request = proto.caret.FetchLiteLlmModelsRequest.create({
			baseUrl: "",
			apiKey: "test-key",
		})

		const result = await fetchLiteLlmModels(mockController, request)

		expect(result.success).toBe(false)
		expect(result.models).toEqual([])
		expect(result.errorMessage).toBe("Base URL is required")
		expect(mockedAxios.get).not.toHaveBeenCalled()
	})

	it("should handle HTTP errors gracefully", async () => {
		mockedAxios.get.mockRejectedValueOnce(new Error("Network error"))

		const request = proto.caret.FetchLiteLlmModelsRequest.create({
			baseUrl: "https://api.litellm.com",
			apiKey: "test-key",
		})

		const result = await fetchLiteLlmModels(mockController, request)

		expect(result.success).toBe(false)
		expect(result.models).toEqual([])
		expect(result.errorMessage).toBe("Failed to fetch models: Network error")
	})

	it("should handle empty models list", async () => {
		const mockEmptyResponse = {
			data: {
				data: [],
				object: "list",
			},
		}

		mockedAxios.get.mockResolvedValueOnce(mockEmptyResponse)

		const request = proto.caret.FetchLiteLlmModelsRequest.create({
			baseUrl: "https://api.litellm.com",
			apiKey: "test-key",
		})

		const result = await fetchLiteLlmModels(mockController, request)

		expect(result.success).toBe(true)
		expect(result.models).toEqual([])
		expect(result.errorMessage).toBe("")
	})

	it("should work without API key (for public endpoints)", async () => {
		const mockModelsResponse = {
			data: {
				data: [{ id: "public-model", object: "model", created: 1677610602, owned_by: "provider" }],
				object: "list",
			},
		}

		mockedAxios.get.mockResolvedValueOnce(mockModelsResponse)

		const request = proto.caret.FetchLiteLlmModelsRequest.create({
			baseUrl: "https://api.litellm.com",
			apiKey: "",
		})

		const result = await fetchLiteLlmModels(mockController, request)

		expect(result.success).toBe(true)
		expect(result.models).toEqual(["public-model"])
		expect(mockedAxios.get).toHaveBeenCalledWith(
			"https://api.litellm.com/v1/models?return_wildcard_routes=false&include_model_access_groups=false&only_model_access_groups=false&include_metadata=false",
			{
				headers: {
					accept: "application/json",
					// No x-litellm-api-key header when API key is empty
				},
				timeout: 10000,
			},
		)
	})
})
