package com.caret.intellij.ui

import com.caret.intellij.hostbridge.HostBridgeServer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

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
    
    /**
     * Route incoming message from WebView to appropriate HostBridge service
     */
    suspend fun routeMessage(messageJson: String) {
        try {
            val json = JSONObject(messageJson)
            val type = json.optString("type")
            
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
     */
    private suspend fun handleGrpcRequest(json: JSONObject) {
        val service = json.optString("service")
        val method = json.optString("method")
        val requestId = json.optString("requestId")
        val data = json.optJSONObject("data") ?: JSONObject()
        
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
     */
    private suspend fun routeWorkspaceService(method: String, data: JSONObject): Any {
        return when (method) {
            "getWorkspacePaths" -> {
                // Call HostBridge WorkspaceService.getWorkspacePaths
                // TODO: Implement actual gRPC call
                mapOf("workspacePath" to "/path/to/workspace")
            }
            "saveOpenDocumentIfDirty" -> {
                val path = data.optString("path")
                // TODO: Implement actual gRPC call
                mapOf("saved" to true)
            }
            "openClineSidebarPanel" -> {
                // TODO: Implement actual gRPC call
                mapOf("opened" to true)
            }
            else -> throw IllegalArgumentException("Unknown WorkspaceService method: $method")
        }
    }
    
    /**
     * Route to EnvService methods
     */
    private suspend fun routeEnvService(method: String, data: JSONObject): Any {
        return when (method) {
            "clipboardWriteText" -> {
                val text = data.optString("text")
                // TODO: Implement actual gRPC call
                mapOf("success" to true)
            }
            "getHostVersion" -> {
                // TODO: Implement actual gRPC call
                mapOf(
                    "version" to "1.0.0",
                    "hostType" to "intellij"
                )
            }
            else -> throw IllegalArgumentException("Unknown EnvService method: $method")
        }
    }
    
    /**
     * Route to WindowService methods
     */
    private suspend fun routeWindowService(method: String, data: JSONObject): Any {
        return when (method) {
            "showInformationMessage" -> {
                val message = data.optString("message")
                // TODO: Implement actual gRPC call
                mapOf("result" to "ok")
            }
            "showErrorMessage" -> {
                val message = data.optString("message")
                // TODO: Implement actual gRPC call
                mapOf("result" to "ok")
            }
            else -> throw IllegalArgumentException("Unknown WindowService method: $method")
        }
    }
    
    /**
     * Route to DiffService methods
     */
    private suspend fun routeDiffService(method: String, data: JSONObject): Any {
        return when (method) {
            "openDiff" -> {
                val leftPath = data.optString("leftPath")
                val rightPath = data.optString("rightPath")
                // TODO: Implement actual gRPC call
                mapOf("opened" to true)
            }
            else -> throw IllegalArgumentException("Unknown DiffService method: $method")
        }
    }
    
    /**
     * Route to TestingService methods
     */
    private suspend fun routeTestingService(method: String, data: JSONObject): Any {
        return when (method) {
            "runTests" -> {
                // TODO: Implement actual gRPC call
                mapOf("testsPassed" to 0, "testsFailed" to 0)
            }
            else -> throw IllegalArgumentException("Unknown TestingService method: $method")
        }
    }
    
    /**
     * Handle ping message (health check)
     */
    private suspend fun handlePing(json: JSONObject) {
        val requestId = json.optString("requestId")
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
