import * as fs from "node:fs"
import * as path from "node:path"
import { Anthropic } from "@anthropic-ai/sdk"
import { afterEach, beforeEach, describe, it } from "mocha"
import sinon from "sinon"
import "should"
import type { ClaudeCodeMessage } from "@/integrations/claude-code/types"
import { ClaudeCodeHandler } from "../claude-code"

describe("ClaudeCodeHandler", () => {
	let handler: ClaudeCodeHandler
	let sandbox: sinon.SinonSandbox

	beforeEach(() => {
		sandbox = sinon.createSandbox()
		handler = new ClaudeCodeHandler({
			claudeCodePath: "/mock/path",
			apiModelId: "claude-opus-4-1-20250805",
		})
	})

	afterEach(() => {
		sandbox.restore()
	})

	describe("token counting", () => {
		it("should correctly handle token usage from assistant messages", async () => {
			// The 'input_tokens' field represents the TOTAL number of input tokens used.
			// See https://docs.anthropic.com/en/api/messages#usage-object

			// Mock the runClaudeCode function
			const runClaudeCodeModule = await import("@/integrations/claude-code/run")
			const runClaudeCodeStub = sandbox.stub(runClaudeCodeModule, "runClaudeCode")

			// Create a proper async generator mock for the Claude Code response
			async function* mockGenerator() {
				// First yield the system init
				yield {
					type: "system",
					subtype: "init",
					apiKeySource: "api",
				}

				// Yield assistant message with usage data
				// Example: If base input is 70 tokens, cache read is 20, and cache creation is 10,
				// then input_tokens from Anthropic API will be 100 (70 + 20 + 10)
				yield {
					type: "assistant",
					message: {
						content: [
							{
								type: "text",
								text: "Test response",
							},
						],
						usage: {
							input_tokens: 100, // Total including cache (per Anthropic docs)
							output_tokens: 50,
							cache_read_input_tokens: 20, // Already included in input_tokens
							cache_creation_input_tokens: 10, // Already included in input_tokens
						},
						stop_reason: "end_turn",
					},
				}

				// Yield result with cost
				yield {
					type: "result",
					result: {},
					total_cost_usd: 0.005,
				}
			}

			runClaudeCodeStub.returns(mockGenerator() as any)

			const systemPrompt = "You are a helpful assistant."
			const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: "Hello" }]

			const usageData: any[] = []

			// Collect the results
			for await (const chunk of handler.createMessage(systemPrompt, messages)) {
				if (chunk.type === "usage") {
					usageData.push({
						inputTokens: chunk.inputTokens,
						outputTokens: chunk.outputTokens,
						cacheReadTokens: chunk.cacheReadTokens,
						cacheWriteTokens: chunk.cacheWriteTokens,
						totalCost: chunk.totalCost,
					})
				}
			}

			// Verify token counting follows Anthropic API specification
			usageData.should.have.length(1)
			usageData[0].should.deepEqual({
				inputTokens: 100, // Total including cache tokens (per Anthropic API docs)
				outputTokens: 50,
				cacheReadTokens: 20, // Tracked separately for reporting
				cacheWriteTokens: 10, // Tracked separately for reporting
				totalCost: 0.005,
			})

			// CRITICAL ASSERTION: Verify that input_tokens is NOT inflated by re-adding cache tokens
			// The bug would have caused inputTokens to be incorrectly calculated as 130 (100 + 20 + 10)
			// The fix ensures it remains 100, as per Anthropic's specification
			usageData[0].inputTokens.should.equal(100) // Correct: matches API response
			usageData[0].inputTokens.should.not.equal(130) // Would be wrong: double-counting cache tokens
		})

		it("should handle missing usage fields with nullish coalescing", async () => {
			// Mock the runClaudeCode function
			const runClaudeCodeModule = await import("@/integrations/claude-code/run")
			const runClaudeCodeStub = sandbox.stub(runClaudeCodeModule, "runClaudeCode")

			// Create a proper async generator mock with missing/undefined usage fields
			async function* mockGenerator() {
				yield {
					type: "assistant",
					message: {
						content: [
							{
								type: "text",
								text: "Test response",
							},
						],
						usage: {
							input_tokens: 100,
							output_tokens: 50,
							// cache fields are undefined/missing
						},
						stop_reason: "end_turn",
					},
				}

				yield {
					type: "result",
					result: {},
					total_cost_usd: 0.005,
				}
			}

			runClaudeCodeStub.returns(mockGenerator() as any)

			const systemPrompt = "You are a helpful assistant."
			const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: "Hello" }]

			const usageData: any[] = []

			// Collect the results
			for await (const chunk of handler.createMessage(systemPrompt, messages)) {
				if (chunk.type === "usage") {
					usageData.push({
						inputTokens: chunk.inputTokens,
						outputTokens: chunk.outputTokens,
						cacheReadTokens: chunk.cacheReadTokens,
						cacheWriteTokens: chunk.cacheWriteTokens,
					})
				}
			}

			// Verify that undefined cache tokens default to 0
			usageData.should.have.length(1)
			usageData[0].should.deepEqual({
				inputTokens: 100,
				outputTokens: 50,
				cacheReadTokens: 0, // Should default to 0
				cacheWriteTokens: 0, // Should default to 0
			})
		})

		it("should handle completely missing usage object", async () => {
			// Mock the runClaudeCode function
			const runClaudeCodeModule = await import("@/integrations/claude-code/run")
			const runClaudeCodeStub = sandbox.stub(runClaudeCodeModule, "runClaudeCode")

			// Create a proper async generator mock with missing usage object
			async function* mockGenerator() {
				yield {
					type: "assistant",
					message: {
						content: [
							{
								type: "text",
								text: "Test response",
							},
						],
						// usage is undefined
						usage: undefined,
						stop_reason: "end_turn",
					},
				}

				// Need to yield a result chunk to trigger usage data emission
				yield {
					type: "result",
					result: {},
					total_cost_usd: 0,
				}
			}

			runClaudeCodeStub.returns(mockGenerator() as any)

			const systemPrompt = "You are a helpful assistant."
			const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: "Hello" }]

			const usageData: any[] = []

			// Collect the results
			for await (const chunk of handler.createMessage(systemPrompt, messages)) {
				if (chunk.type === "usage") {
					usageData.push({
						inputTokens: chunk.inputTokens,
						outputTokens: chunk.outputTokens,
						cacheReadTokens: chunk.cacheReadTokens,
						cacheWriteTokens: chunk.cacheWriteTokens,
					})
				}
			}

			// All token counts should default to 0 when usage is undefined
			usageData.should.have.length(1)
			usageData[0].should.deepEqual({
				inputTokens: 0,
				outputTokens: 0,
				cacheReadTokens: 0,
				cacheWriteTokens: 0,
			})
		})
	})

	describe("getModel", () => {
		it("should return the correct model when specified", () => {
			const handler = new ClaudeCodeHandler({
				apiModelId: "claude-sonnet-4-5-20250929",
			})

			const model = handler.getModel()
			model.id.should.equal("claude-sonnet-4-5-20250929")
		})

		it("should return default model when not specified", () => {
			const handler = new ClaudeCodeHandler({})

			const model = handler.getModel()
			// The default model should be set
			model.id.should.be.type("string")
			model.info.should.be.type("object")
		})
	})

	// CARET MODIFICATION: Test Task tool's user message with tool_result parsing (F12)
	describe("user message with tool_result parsing", () => {
		it("should parse user message with tool_result from Task tool", async () => {
			// Mock the runClaudeCode function
			const runClaudeCodeModule = await import("@/integrations/claude-code/run")
			const runClaudeCodeStub = sandbox.stub(runClaudeCodeModule, "runClaudeCode")

			// Create mock for Task tool response with user message
			async function* mockGenerator() {
				// First: assistant with tool_use
				yield {
					type: "assistant",
					message: {
						content: [
							{
								type: "tool_use",
								id: "toolu_task_123",
								name: "Task",
								input: {
									description: "Create test file",
									prompt: "Create a test.txt file",
									subagent_type: "general-purpose",
								},
							},
						],
						stop_reason: null,
					},
				}

				// Second: user message with tool_result (서브에이전트 실행 결과)
				yield {
					type: "user",
					message: {
						content: [
							{
								type: "tool_result",
								tool_use_id: "toolu_task_123",
								content: [
									{
										type: "text",
										text: "## Task Completed\n\nSubtask finished successfully.\nFile test.txt created.",
									},
								],
							},
						],
					},
				}

				// Third: result with cost
				yield {
					type: "result",
					result: {},
					total_cost_usd: 0.01,
				}
			}

			runClaudeCodeStub.returns(mockGenerator() as any)

			const systemPrompt = "You are a helpful assistant."
			const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: "Test" }]

			const chunks: any[] = []

			// Collect all chunks
			for await (const chunk of handler.createMessage(systemPrompt, messages)) {
				chunks.push(chunk)
			}

			// Verify tool_use chunk
			const toolUseChunk = chunks.find((c) => c.type === "tool_use")
			toolUseChunk.should.not.be.undefined()
			toolUseChunk.name.should.equal("Task")

			// Verify text chunk from user message
			const textChunks = chunks.filter((c) => c.type === "text")
			textChunks.should.have.length(1)
			textChunks[0].text.should.equal("## Task Completed\n\nSubtask finished successfully.\nFile test.txt created.")
		})

		it("should handle multiple text blocks in user tool_result", async () => {
			// Mock the runClaudeCode function
			const runClaudeCodeModule = await import("@/integrations/claude-code/run")
			const runClaudeCodeStub = sandbox.stub(runClaudeCodeModule, "runClaudeCode")

			// Create mock with multiple text blocks
			async function* mockGenerator() {
				yield {
					type: "user",
					message: {
						content: [
							{
								type: "tool_result",
								tool_use_id: "toolu_multi_123",
								content: [
									{
										type: "text",
										text: "First result",
									},
									{
										type: "text",
										text: "Second result",
									},
								],
							},
						],
					},
				}

				yield {
					type: "result",
					result: {},
					total_cost_usd: 0,
				}
			}

			runClaudeCodeStub.returns(mockGenerator() as any)

			const systemPrompt = "You are a helpful assistant."
			const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: "Test" }]

			const textChunks: string[] = []

			// Collect text chunks
			for await (const chunk of handler.createMessage(systemPrompt, messages)) {
				if (chunk.type === "text") {
					textChunks.push(chunk.text)
				}
			}

			// Verify all text blocks were parsed
			textChunks.should.have.length(2)
			textChunks[0].should.equal("First result")
			textChunks[1].should.equal("Second result")
		})

		it("should handle string-based tool_result in user message", async () => {
			// Mock the runClaudeCode function
			const runClaudeCodeModule = await import("@/integrations/claude-code/run")
			const runClaudeCodeStub = sandbox.stub(runClaudeCodeModule, "runClaudeCode")

			// Create mock with string content
			async function* mockGenerator() {
				yield {
					type: "user",
					message: {
						content: [
							{
								type: "tool_result",
								tool_use_id: "toolu_string_123",
								content: "Simple string result",
							},
						],
					},
				}

				yield {
					type: "result",
					result: {},
					total_cost_usd: 0,
				}
			}

			runClaudeCodeStub.returns(mockGenerator() as any)

			const systemPrompt = "You are a helpful assistant."
			const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: "Test" }]

			const textChunks: string[] = []

			// Collect text chunks
			for await (const chunk of handler.createMessage(systemPrompt, messages)) {
				if (chunk.type === "text") {
					textChunks.push(chunk.text)
				}
			}

			// Verify string content was parsed
			textChunks.should.have.length(1)
			textChunks[0].should.equal("Simple string result")
		})
	})

	// CARET MODIFICATION: Integration test with real CLI response fixture (F12)
	describe("real CLI response integration test", () => {
		it("should parse actual Claude Code CLI Task tool response", async () => {
			// Mock the runClaudeCode function
			const runClaudeCodeModule = await import("@/integrations/claude-code/run")
			const runClaudeCodeStub = sandbox.stub(runClaudeCodeModule, "runClaudeCode")

			// Load the actual CLI response fixture
			const fixturePath = path.join(__dirname, "fixtures", "claude-code-task-response.jsonl")
			const fixtureContent = fs.readFileSync(fixturePath, "utf-8")
			const fixtureLines = fixtureContent.trim().split("\n")

			// Parse JSONL into message objects
			const messages: ClaudeCodeMessage[] = fixtureLines.map((line) => JSON.parse(line))

			// Create async generator from fixture data
			async function* fixtureGenerator() {
				for (const message of messages) {
					yield message
				}
			}

			runClaudeCodeStub.returns(fixtureGenerator() as any)

			const systemPrompt = "You are a helpful assistant."
			const userMessages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: "Test" }]

			const chunks: any[] = []

			// Collect all chunks
			for await (const chunk of handler.createMessage(systemPrompt, userMessages)) {
				chunks.push(chunk)
			}

			// Verify we got text chunks from user messages with tool_result
			const textChunks = chunks.filter((c) => c.type === "text")
			textChunks.should.not.be.empty()

			// Verify specific text from the fixture
			const taskResultTexts = textChunks.map((c) => c.text)

			// The fixture contains 3 user messages with tool_result content
			// 1. Permission request error
			// 2. Directory listing
			// 3. Task completion message
			taskResultTexts
				.some((text) => text.includes("Claude requested permissions to write to /Users/luke/dev/caret/caret-scripts"))
				.should.be.true()
			taskResultTexts.some((text) => text.includes("total 272")).should.be.true()
			taskResultTexts.some((text) => text.includes("Once you approve it")).should.be.true()
		})
	})

	// CARET MODIFICATION: Test Task tool's array-based tool_result parsing (F12)
	describe("assistant message tool_result parsing (legacy)", () => {
		it("should parse Task tool's array-based tool_result content", async () => {
			// Mock the runClaudeCode function
			const runClaudeCodeModule = await import("@/integrations/claude-code/run")
			const runClaudeCodeStub = sandbox.stub(runClaudeCodeModule, "runClaudeCode")

			// Create mock for Task tool response with array-based content
			async function* mockGenerator() {
				yield {
					type: "assistant",
					message: {
						content: [
							{
								type: "tool_result",
								tool_use_id: "toolu_123",
								content: [
									{
										type: "text",
										text: "## Task Completed\n\nSubtask finished successfully.",
									},
								],
							},
						],
						stop_reason: "end_turn",
					},
				}

				yield {
					type: "result",
					result: {},
					total_cost_usd: 0,
				}
			}

			runClaudeCodeStub.returns(mockGenerator() as any)

			const systemPrompt = "You are a helpful assistant."
			const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: "Test" }]

			const textChunks: string[] = []

			// Collect text chunks
			for await (const chunk of handler.createMessage(systemPrompt, messages)) {
				if (chunk.type === "text") {
					textChunks.push(chunk.text)
				}
			}

			// Verify Task tool's array content was parsed correctly
			textChunks.should.have.length(1)
			textChunks[0].should.equal("## Task Completed\n\nSubtask finished successfully.")
		})

		it("should parse regular tool's string-based tool_result content", async () => {
			// Mock the runClaudeCode function
			const runClaudeCodeModule = await import("@/integrations/claude-code/run")
			const runClaudeCodeStub = sandbox.stub(runClaudeCodeModule, "runClaudeCode")

			// Create mock for regular tool response with string content
			async function* mockGenerator() {
				yield {
					type: "assistant",
					message: {
						content: [
							{
								type: "tool_result",
								tool_use_id: "toolu_456",
								content: "File created successfully",
							},
						],
						stop_reason: "end_turn",
					},
				}

				yield {
					type: "result",
					result: {},
					total_cost_usd: 0,
				}
			}

			runClaudeCodeStub.returns(mockGenerator() as any)

			const systemPrompt = "You are a helpful assistant."
			const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: "Test" }]

			const textChunks: string[] = []

			// Collect text chunks
			for await (const chunk of handler.createMessage(systemPrompt, messages)) {
				if (chunk.type === "text") {
					textChunks.push(chunk.text)
				}
			}

			// Verify regular tool's string content was parsed correctly
			textChunks.should.have.length(1)
			textChunks[0].should.equal("File created successfully")
		})

		it("should handle multiple text blocks in Task tool's tool_result", async () => {
			// Mock the runClaudeCode function
			const runClaudeCodeModule = await import("@/integrations/claude-code/run")
			const runClaudeCodeStub = sandbox.stub(runClaudeCodeModule, "runClaudeCode")

			// Create mock with multiple text blocks
			async function* mockGenerator() {
				yield {
					type: "assistant",
					message: {
						content: [
							{
								type: "tool_result",
								tool_use_id: "toolu_789",
								content: [
									{
										type: "text",
										text: "First result",
									},
									{
										type: "text",
										text: "Second result",
									},
								],
							},
						],
						stop_reason: "end_turn",
					},
				}

				yield {
					type: "result",
					result: {},
					total_cost_usd: 0,
				}
			}

			runClaudeCodeStub.returns(mockGenerator() as any)

			const systemPrompt = "You are a helpful assistant."
			const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: "Test" }]

			const textChunks: string[] = []

			// Collect text chunks
			for await (const chunk of handler.createMessage(systemPrompt, messages)) {
				if (chunk.type === "text") {
					textChunks.push(chunk.text)
				}
			}

			// Verify all text blocks were parsed
			textChunks.should.have.length(2)
			textChunks[0].should.equal("First result")
			textChunks[1].should.equal("Second result")
		})

		it("should handle empty array in tool_result content", async () => {
			// Mock the runClaudeCode function
			const runClaudeCodeModule = await import("@/integrations/claude-code/run")
			const runClaudeCodeStub = sandbox.stub(runClaudeCodeModule, "runClaudeCode")

			// Create mock with empty array
			async function* mockGenerator() {
				yield {
					type: "assistant",
					message: {
						content: [
							{
								type: "tool_result",
								tool_use_id: "toolu_empty",
								content: [],
							},
						],
						stop_reason: "end_turn",
					},
				}

				yield {
					type: "result",
					result: {},
					total_cost_usd: 0,
				}
			}

			runClaudeCodeStub.returns(mockGenerator() as any)

			const systemPrompt = "You are a helpful assistant."
			const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: "Test" }]

			const textChunks: string[] = []

			// Collect text chunks
			for await (const chunk of handler.createMessage(systemPrompt, messages)) {
				if (chunk.type === "text") {
					textChunks.push(chunk.text)
				}
			}

			// Empty array should produce no text chunks
			textChunks.should.have.length(0)
		})
	})
})
