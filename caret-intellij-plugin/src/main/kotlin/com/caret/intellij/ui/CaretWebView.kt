package com.caret.intellij.ui

import com.caret.intellij.hostbridge.HostBridgeServer
import com.intellij.openapi.Disposable
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Disposer
import com.intellij.ui.jcef.JBCefBrowser
import com.intellij.ui.jcef.JBCefJSQuery
import kotlinx.coroutines.*
import org.cef.browser.CefBrowser
import org.cef.browser.CefFrame
import org.cef.handler.CefLoadHandlerAdapter
import java.awt.BorderLayout
import java.io.File
import javax.swing.JPanel

/**
 * CaretWebView - JCEF browser component for Caret UI
 * 
 * Responsibilities:
 * - Initialize HostBridgeServer and start gRPC server
 * - Create JBCefBrowser instance with JCEF
 * - Setup JavaScript ↔ Kotlin message bridge
 * - Load Caret React UI from webview-ui/build/index.html
 * - Route messages between WebView and HostBridge services
 */
class CaretWebView(private val project: Project) : Disposable {
    
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val hostBridgeServer: HostBridgeServer
    private val browser: JBCefBrowser
    private val jsQuery: JBCefJSQuery
    private val messageRouter: WebViewMessageRouter
    
    val component: JPanel
    
    init {
        // Initialize HostBridge gRPC server
        hostBridgeServer = HostBridgeServer(project)
        scope.launch {
            hostBridgeServer.start()
        }
        
        // Create JCEF browser instance
        browser = JBCefBrowser()
        
        // Setup JavaScript → Kotlin message bridge
        jsQuery = JBCefJSQuery.create(browser)
        jsQuery.addHandler { message ->
            handleWebViewMessage(message)
            null
        }
        
        // Setup message router
        messageRouter = WebViewMessageRouter(hostBridgeServer, ::sendMessageToWebView)
        
        // Setup load handler to inject bridge code
        browser.jbCefClient.addLoadHandler(object : CefLoadHandlerAdapter() {
            override fun onLoadEnd(browser: CefBrowser?, frame: CefFrame?, httpStatusCode: Int) {
                if (frame?.isMain == true) {
                    injectJavaScriptBridge()
                }
            }
        }, browser.cefBrowser)
        
        // Load Caret React UI
        loadCaretUI()
        
        // Setup component
        component = JPanel(BorderLayout()).apply {
            add(browser.component, BorderLayout.CENTER)
        }
        
        Disposer.register(this, browser)
    }
    
    /**
     * Load Caret React UI from webview-ui/build/index.html
     */
    private fun loadCaretUI() {
        // Find webview-ui build directory relative to plugin
        // In development: <project>/webview-ui/build/index.html
        // In production: will be bundled into plugin resources
        
        val projectBasePath = project.basePath ?: return
        val webviewBuildPath = File(projectBasePath).parentFile
            .resolve("webview-ui/build/index.html")
        
        if (webviewBuildPath.exists()) {
            // Development mode - load from local file
            browser.loadURL("file://${webviewBuildPath.absolutePath}")
        } else {
            // Production mode - load from plugin resources
            val resourceUrl = javaClass.classLoader.getResource("webview/index.html")
            if (resourceUrl != null) {
                browser.loadURL(resourceUrl.toString())
            } else {
                // Fallback: show error page
                browser.loadHTML("""
                    <html>
                    <body>
                        <h1>Caret UI not found</h1>
                        <p>Please build the webview-ui first:</p>
                        <pre>npm run build:webview</pre>
                    </body>
                    </html>
                """.trimIndent())
            }
        }
    }
    
    /**
     * Inject JavaScript bridge code for bidirectional communication
     * 
     * This creates a global `vscode` object that mimics VSCode's webview API:
     * - vscode.postMessage(message) → sends message to Kotlin
     * - window.addEventListener('message', handler) → receives messages from Kotlin
     */
    private fun injectJavaScriptBridge() {
        val bridgeCode = """
            (function() {
                // Create vscode API object (VSCode webview compatibility)
                window.vscode = {
                    postMessage: function(message) {
                        ${jsQuery.inject("JSON.stringify(message)")}
                    }
                };
                
                // Store original addEventListener for message events
                const originalAddEventListener = window.addEventListener;
                const messageHandlers = [];
                
                window.addEventListener = function(type, handler, options) {
                    if (type === 'message') {
                        messageHandlers.push(handler);
                    } else {
                        originalAddEventListener.call(window, type, handler, options);
                    }
                };
                
                // Function to dispatch messages from Kotlin to JavaScript
                window.__dispatchMessageFromKotlin = function(message) {
                    const event = new MessageEvent('message', {
                        data: message
                    });
                    messageHandlers.forEach(handler => {
                        try {
                            handler(event);
                        } catch (e) {
                            console.error('Error in message handler:', e);
                        }
                    });
                };
                
                console.log('Caret JavaScript bridge initialized');
            })();
        """.trimIndent()
        
        browser.cefBrowser.executeJavaScript(bridgeCode, browser.cefBrowser.url, 0)
    }
    
    /**
     * Handle message from WebView (JavaScript → Kotlin)
     * 
     * Messages are routed to HostBridge gRPC services via WebViewMessageRouter.
     */
    private fun handleWebViewMessage(messageJson: String) {
        scope.launch {
            try {
                println("[CaretWebView] Received message from WebView: $messageJson")
                messageRouter.routeMessage(messageJson)
            } catch (e: Exception) {
                println("[CaretWebView] Error handling message: ${e.message}")
                e.printStackTrace()
            }
        }
    }
    
    /**
     * Send message from Kotlin to WebView (Kotlin → JavaScript)
     */
    fun sendMessageToWebView(message: Any) {
        val messageJson = when (message) {
            is String -> message
            else -> {
                // TODO: Use proper JSON serialization (kotlinx.serialization or Gson)
                message.toString()
            }
        }
        
        val jsCode = "window.__dispatchMessageFromKotlin($messageJson)"
        browser.cefBrowser.executeJavaScript(jsCode, browser.cefBrowser.url, 0)
    }
    
    override fun dispose() {
        scope.cancel()
        hostBridgeServer.stop()
    }
}
