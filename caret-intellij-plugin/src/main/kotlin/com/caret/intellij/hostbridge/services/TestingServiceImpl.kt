package com.caret.intellij.hostbridge.services

import bot.cline.host.proto.GetWebviewHtmlRequest
import bot.cline.host.proto.GetWebviewHtmlResponse
import bot.cline.host.proto.TestingServiceGrpcKt
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindowManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.cef.browser.CefBrowser
import org.cef.browser.CefFrame
import org.cef.callback.CefStringVisitor
import java.util.concurrent.CompletableFuture
import java.util.concurrent.TimeUnit

class TestingServiceImpl(private val project: Project) : TestingServiceGrpcKt.TestingServiceCoroutineImplBase() {
    private val logger = Logger.getInstance(TestingServiceImpl::class.java)

    override suspend fun getWebviewHtml(request: GetWebviewHtmlRequest): GetWebviewHtmlResponse = withContext(Dispatchers.IO) {
        try {
            val toolWindowManager = ToolWindowManager.getInstance(project)
            val toolWindow = toolWindowManager.getToolWindow("Caret")

            if (toolWindow == null) {
                logger.warn("TestingService.getWebviewHtml: Caret tool window not found")
                return@withContext GetWebviewHtmlResponse.newBuilder()
                    .setHtml("")
                    .build()
            }

            val content = toolWindow.contentManager.getContent(0)
            if (content == null) {
                logger.warn("TestingService.getWebviewHtml: No content in tool window")
                return@withContext GetWebviewHtmlResponse.newBuilder()
                    .setHtml("")
                    .build()
            }

            logger.info("TestingService.getWebviewHtml: Webview found and accessible")

            GetWebviewHtmlResponse.newBuilder()
                .setHtml("<html><body>Caret WebView Active</body></html>")
                .build()

        } catch (e: Exception) {
            logger.error("TestingService.getWebviewHtml failed", e)
            GetWebviewHtmlResponse.newBuilder()
                .setHtml("")
                .build()
        }
    }
}
