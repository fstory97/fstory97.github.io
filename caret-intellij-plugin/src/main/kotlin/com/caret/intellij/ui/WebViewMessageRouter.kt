package com.caret.intellij.ui

import com.caret.intellij.hostbridge.HostBridgeServer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import bot.cline.host.proto.*
import bot.cline.proto.EmptyRequest
import bot.cline.proto.StringRequest

/**
 * WebViewMessageRouter - Route messages between WebView and HostBridge services
 * 
 * This class parses incoming messages from the WebView (JavaScript)
 * and routes them to the appropriate HostBridge gRPC service methods.
 * 
 * Message format from WebView:
 * {
 *   "type": "grpc_request",
 *   "service": "WorkspaceService",
 *   "method": "getWorkspacePaths",
 *   "requestId": "unique_id",
 *   "data": { ... }
 * }
 */
class WebViewMessageRouter(
    private val hostBridgeServer: HostBridgeServer,
    private val sendMessageToWebView: (Any) -> Unit
) {
    private val gson = Gson()
    
    /**
     * Route incoming message from WebView to appropriate HostBridge service
     * Phase 4: Gson으로 JSON 파싱
     */
    suspend fun routeMessage(messageJson: String) {
        try {
            val json = JsonParser.parseString(messageJson).asJsonObject
            val type = json.get("type")?.asString ?: ""
            
            when (type) {
                "grpc_request" -> handleGrpcRequest(json)
                "ping" -> handlePing(json)
                else -> {
                    sendError("unknown_message_type", "Unknown message type: $type")
                }
            }
        } catch (e: Exception) {
            sendError("parse_error", "Failed to parse message: ${e.message}")
        }
    }
    
    /**
     * Handle gRPC service request
     * Phase 4: JsonObject 사용
     */
    private suspend fun handleGrpcRequest(json: JsonObject) {
        val service = json.get("service")?.asString ?: ""
        val method = json.get("method")?.asString ?: ""
        val requestId = json.get("requestId")?.asString ?: ""
        val data = json.getAsJsonObject("data") ?: JsonObject()
        
        try {
            // Route to appropriate service based on service name
            val result = when (service) {
                "WorkspaceService" -> routeWorkspaceService(method, data)
                "EnvService" -> routeEnvService(method, data)
                "WindowService" -> routeWindowService(method, data)
                "DiffService" -> routeDiffService(method, data)
                "TestingService" -> routeTestingService(method, data)
                else -> {
                    throw IllegalArgumentException("Unknown service: $service")
                }
            }
            
            // Send success response back to WebView
            sendMessageToWebView(mapOf(
                "type" to "grpc_response",
                "requestId" to requestId,
                "success" to true,
                "data" to result
            ))
        } catch (e: Exception) {
            // Send error response back to WebView
            sendMessageToWebView(mapOf(
                "type" to "grpc_response",
                "requestId" to requestId,
                "success" to false,
                "error" to mapOf(
                    "code" to "service_error",
                    "message" to (e.message ?: "Unknown error")
                )
            ))
        }
    }
    
    /**
     * Route to WorkspaceService methods
     * Phase 6: Actual gRPC implementation
     */
    private suspend fun routeWorkspaceService(method: String, data: JsonObject): Any {
        return withContext(Dispatchers.IO) {
            when (method) {
                "getWorkspacePaths" -> {
                    val request = GetWorkspacePathsRequest.newBuilder().build()
                    val response = hostBridgeServer.workspaceService.getWorkspacePaths(request)
                    mapOf(
                        "id" to (response.id ?: ""),
                        "paths" to response.pathsList
                    )
                }
                "saveOpenDocumentIfDirty" -> {
                    val filePath = data.get("filePath")?.asString ?: ""
                    val request = SaveOpenDocumentIfDirtyRequest.newBuilder()
                        .setFilePath(filePath)
                        .build()
                    val response = hostBridgeServer.workspaceService.saveOpenDocumentIfDirty(request)
                    mapOf("wasSaved" to (response.wasSaved ?: false))
                }
                "openClineSidebarPanel" -> {
                    val request = OpenClineSidebarPanelRequest.newBuilder().build()
                    hostBridgeServer.workspaceService.openClineSidebarPanel(request)
                    mapOf("success" to true)
                }
                "openProblemsPanel" -> {
                    val request = OpenProblemsPanelRequest.newBuilder().build()
                    hostBridgeServer.workspaceService.openProblemsPanel(request)
                    mapOf("success" to true)
                }
                "openTerminalPanel" -> {
                    val request = OpenTerminalRequest.newBuilder().build()
                    hostBridgeServer.workspaceService.openTerminalPanel(request)
                    mapOf("success" to true)
                }
                "openInFileExplorerPanel" -> {
                    val path = data.get("path")?.asString ?: ""
                    val request = OpenInFileExplorerPanelRequest.newBuilder()
                        .setPath(path)
                        .build()
                    hostBridgeServer.workspaceService.openInFileExplorerPanel(request)
                    mapOf("success" to true)
                }
                else -> throw IllegalArgumentException("Unknown WorkspaceService method: $method")
            }
        }
    }
    
    /**
     * Route to EnvService methods
     * Phase 6: Actual gRPC implementation
     */
    private suspend fun routeEnvService(method: String, data: JsonObject): Any {
        return withContext(Dispatchers.IO) {
            when (method) {
                "clipboardWriteText" -> {
                    val text = data.get("text")?.asString ?: ""
                    val request = StringRequest.newBuilder()
                        .setValue(text)
                        .build()
                    hostBridgeServer.envService.clipboardWriteText(request)
                    mapOf("success" to true)
                }
                "clipboardReadText" -> {
                    val request = EmptyRequest.newBuilder().build()
                    val response = hostBridgeServer.envService.clipboardReadText(request)
                    mapOf("text" to response.value)
                }
                "getHostVersion" -> {
                    val request = EmptyRequest.newBuilder().build()
                    val response = hostBridgeServer.envService.getHostVersion(request)
                    mapOf(
                        "platform" to (response.platform ?: ""),
                        "version" to (response.version ?: ""),
                        "clineType" to (response.clineType ?: ""),
                        "clineVersion" to (response.clineVersion ?: "")
                    )
                }
                "getIdeRedirectUri" -> {
                    val request = EmptyRequest.newBuilder().build()
                    val response = hostBridgeServer.envService.getIdeRedirectUri(request)
                    mapOf("uri" to response.value)
                }
                else -> throw IllegalArgumentException("Unknown EnvService method: $method")
            }
        }
    }
    
    /**
     * Route to WindowService methods
     * Phase 7: Actual gRPC implementation
     */
    private suspend fun routeWindowService(method: String, data: JsonObject): Any {
        return withContext(Dispatchers.IO) {
            when (method) {
                "showTextDocument" -> {
                    val path = data.get("path")?.asString ?: ""
                    val request = ShowTextDocumentRequest.newBuilder()
                        .setPath(path)
                        .build()
                    val response = hostBridgeServer.windowService.showTextDocument(request)
                    mapOf(
                        "documentPath" to response.documentPath,
                        "isActive" to response.isActive
                    )
                }
                "showOpenDialogue" -> {
                    val canSelectMany = data.get("canSelectMany")?.asBoolean ?: false
                    val request = ShowOpenDialogueRequest.newBuilder()
                        .setCanSelectMany(canSelectMany)
                        .build()
                    val response = hostBridgeServer.windowService.showOpenDialogue(request)
                    mapOf("paths" to response.pathsList)
                }
                "showMessage" -> {
                    val message = data.get("message")?.asString ?: ""
                    val typeStr = data.get("type")?.asString ?: "INFORMATION"
                    val type = when (typeStr) {
                        "ERROR" -> ShowMessageType.ERROR
                        "WARNING" -> ShowMessageType.WARNING
                        else -> ShowMessageType.INFORMATION
                    }
                    val request = ShowMessageRequest.newBuilder()
                        .setMessage(message)
                        .setType(type)
                        .build()
                    val response = hostBridgeServer.windowService.showMessage(request)
                    mapOf("selectedOption" to (response.selectedOption ?: ""))
                }
                "showInputBox" -> {
                    val title = data.get("title")?.asString ?: ""
                    val prompt = data.get("prompt")?.asString ?: ""
                    val value = data.get("value")?.asString ?: ""
                    val request = ShowInputBoxRequest.newBuilder()
                        .setTitle(title)
                        .setPrompt(prompt)
                        .setValue(value)
                        .build()
                    val response = hostBridgeServer.windowService.showInputBox(request)
                    mapOf("response" to (response.response ?: ""))
                }
                "showSaveDialog" -> {
                    val request = ShowSaveDialogRequest.newBuilder().build()
                    val response = hostBridgeServer.windowService.showSaveDialog(request)
                    mapOf("selectedPath" to (response.selectedPath ?: ""))
                }
                "openFile" -> {
                    val filePath = data.get("filePath")?.asString ?: ""
                    val request = OpenFileRequest.newBuilder()
                        .setFilePath(filePath)
                        .build()
                    hostBridgeServer.windowService.openFile(request)
                    mapOf("success" to true)
                }
                "openSettings" -> {
                    val query = data.get("query")?.asString ?: ""
                    val request = OpenSettingsRequest.newBuilder()
                        .setQuery(query)
                        .build()
                    hostBridgeServer.windowService.openSettings(request)
                    mapOf("success" to true)
                }
                "getOpenTabs" -> {
                    val request = GetOpenTabsRequest.newBuilder().build()
                    val response = hostBridgeServer.windowService.getOpenTabs(request)
                    mapOf("paths" to response.pathsList)
                }
                "getVisibleTabs" -> {
                    val request = GetVisibleTabsRequest.newBuilder().build()
                    val response = hostBridgeServer.windowService.getVisibleTabs(request)
                    mapOf("paths" to response.pathsList)
                }
                "getActiveEditor" -> {
                    val request = GetActiveEditorRequest.newBuilder().build()
                    val response = hostBridgeServer.windowService.getActiveEditor(request)
                    mapOf("filePath" to (response.filePath ?: ""))
                }
                else -> throw IllegalArgumentException("Unknown WindowService method: $method")
            }
        }
    }
    
    /**
     * Route to DiffService methods
     * Phase 8: Actual gRPC implementation
     */
    private suspend fun routeDiffService(method: String, data: JsonObject): Any {
        return withContext(Dispatchers.IO) {
            when (method) {
                "openDiff" -> {
                    val path = data.get("path")?.asString ?: ""
                    val content = data.get("content")?.asString ?: ""
                    val request = OpenDiffRequest.newBuilder()
                        .setPath(path)
                        .setContent(content)
                        .build()
                    val response = hostBridgeServer.diffService.openDiff(request)
                    mapOf("diffId" to (response.diffId ?: ""))
                }
                "getDocumentText" -> {
                    val diffId = data.get("diffId")?.asString ?: ""
                    val request = GetDocumentTextRequest.newBuilder()
                        .setDiffId(diffId)
                        .build()
                    val response = hostBridgeServer.diffService.getDocumentText(request)
                    mapOf("content" to (response.content ?: ""))
                }
                "replaceText" -> {
                    val diffId = data.get("diffId")?.asString ?: ""
                    val content = data.get("content")?.asString ?: ""
                    val startLine = data.get("startLine")?.asInt ?: 0
                    val endLine = data.get("endLine")?.asInt ?: 0
                    val request = ReplaceTextRequest.newBuilder()
                        .setDiffId(diffId)
                        .setContent(content)
                        .setStartLine(startLine)
                        .setEndLine(endLine)
                        .build()
                    hostBridgeServer.diffService.replaceText(request)
                    mapOf("success" to true)
                }
                "scrollDiff" -> {
                    val diffId = data.get("diffId")?.asString ?: ""
                    val line = data.get("line")?.asInt ?: 0
                    val request = ScrollDiffRequest.newBuilder()
                        .setDiffId(diffId)
                        .setLine(line)
                        .build()
                    hostBridgeServer.diffService.scrollDiff(request)
                    mapOf("success" to true)
                }
                "truncateDocument" -> {
                    val diffId = data.get("diffId")?.asString ?: ""
                    val endLine = data.get("endLine")?.asInt ?: 0
                    val request = TruncateDocumentRequest.newBuilder()
                        .setDiffId(diffId)
                        .setEndLine(endLine)
                        .build()
                    hostBridgeServer.diffService.truncateDocument(request)
                    mapOf("success" to true)
                }
                "saveDocument" -> {
                    val diffId = data.get("diffId")?.asString ?: ""
                    val request = SaveDocumentRequest.newBuilder()
                        .setDiffId(diffId)
                        .build()
                    hostBridgeServer.diffService.saveDocument(request)
                    mapOf("success" to true)
                }
                "closeAllDiffs" -> {
                    val request = CloseAllDiffsRequest.newBuilder().build()
                    hostBridgeServer.diffService.closeAllDiffs(request)
                    mapOf("success" to true)
                }
                "openMultiFileDiff" -> {
                    val title = data.get("title")?.asString ?: "Multi-File Diff"
                    val diffsArray = data.getAsJsonArray("diffs")
                    val requestBuilder = OpenMultiFileDiffRequest.newBuilder()
                        .setTitle(title)
                    
                    diffsArray?.forEach { diffElement ->
                        val diffObj = diffElement.asJsonObject
                        val filePath = diffObj.get("filePath")?.asString ?: ""
                        val leftContent = diffObj.get("leftContent")?.asString ?: ""
                        val rightContent = diffObj.get("rightContent")?.asString ?: ""
                        
                        val contentDiff = ContentDiff.newBuilder()
                            .setFilePath(filePath)
                            .setLeftContent(leftContent)
                            .setRightContent(rightContent)
                            .build()
                        
                        requestBuilder.addDiffs(contentDiff)
                    }
                    
                    hostBridgeServer.diffService.openMultiFileDiff(requestBuilder.build())
                    mapOf("success" to true)
                }
                else -> throw IllegalArgumentException("Unknown DiffService method: $method")
            }
        }
    }
    
    /**
     * Route to TestingService methods
     * Phase 9: Actual gRPC implementation
     */
    private suspend fun routeTestingService(method: String, data: JsonObject): Any {
        return withContext(Dispatchers.IO) {
            when (method) {
                "getWebviewHtml" -> {
                    val request = GetWebviewHtmlRequest.newBuilder().build()
                    val response = hostBridgeServer.testingService.getWebviewHtml(request)
                    mapOf("html" to (response.html ?: ""))
                }
                else -> throw IllegalArgumentException("Unknown TestingService method: $method")
            }
        }
    }
    
    /**
     * Handle ping message (health check)
     * Phase 4: JsonObject 사용
     */
    private suspend fun handlePing(json: JsonObject) {
        val requestId = json.get("requestId")?.asString ?: ""
        sendMessageToWebView(mapOf(
            "type" to "pong",
            "requestId" to requestId,
            "timestamp" to System.currentTimeMillis()
        ))
    }
    
    /**
     * Send error message to WebView
     */
    private fun sendError(code: String, message: String) {
        sendMessageToWebView(mapOf(
            "type" to "error",
            "error" to mapOf(
                "code" to code,
                "message" to message
            )
        ))
    }
}
