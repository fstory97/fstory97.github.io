package com.caret.intellij.hostbridge.services

import com.intellij.ide.plugins.PluginManagerCore
import com.intellij.openapi.application.ApplicationInfo
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.extensions.PluginId
import bot.cline.host.proto.*
import bot.cline.proto.StringRequest
import bot.cline.proto.Empty
import bot.cline.proto.String as ClineString
import bot.cline.proto.EmptyRequest
import io.grpc.Status
import io.grpc.StatusException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.withContext
import java.awt.Toolkit
import java.awt.datatransfer.DataFlavor
import java.awt.datatransfer.StringSelection

/**
 * Implementation of EnvService for IntelliJ Platform
 * 
 * Provides environment operations like clipboard access, host version info, and telemetry settings.
 */
class EnvServiceImpl(
    private val shutdownCallback: () -> Unit
) : EnvServiceGrpcKt.EnvServiceCoroutineImplBase() {
    
    private val logger = Logger.getInstance(EnvServiceImpl::class.java)
    
    override suspend fun clipboardWriteText(request: StringRequest): Empty = withContext(Dispatchers.IO) {
        try {
            logger.info("[EnvService] clipboardWriteText: ${request.value.take(50)}...")
            
            val clipboard = Toolkit.getDefaultToolkit().systemClipboard
            val selection = StringSelection(request.value)
            clipboard.setContents(selection, null)
            
            Empty.getDefaultInstance()
            
        } catch (e: Exception) {
            logger.error("[EnvService] clipboardWriteText failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
    
    override suspend fun clipboardReadText(request: EmptyRequest): ClineString = withContext(Dispatchers.IO) {
        try {
            logger.info("[EnvService] clipboardReadText called")
            
            val clipboard = Toolkit.getDefaultToolkit().systemClipboard
            val contents = clipboard.getContents(null)
            
            val text = if (contents?.isDataFlavorSupported(DataFlavor.stringFlavor) == true) {
                contents.getTransferData(DataFlavor.stringFlavor) as? String ?: ""
            } else {
                ""
            }
            
            ClineString.newBuilder()
                .setValue(text)
                .build()
                
        } catch (e: Exception) {
            logger.error("[EnvService] clipboardReadText failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
    
    override suspend fun getHostVersion(request: EmptyRequest): GetHostVersionResponse = withContext(Dispatchers.IO) {
        try {
            logger.info("[EnvService] getHostVersion called")
            
            // Get IntelliJ Platform info
            val appInfo = ApplicationInfo.getInstance()
            val platformName = appInfo.fullApplicationName
            val platformVersion = appInfo.fullVersion
            
            // Get Caret plugin info
            val pluginId = PluginId.getId("com.caretive.caret")
            val plugin = PluginManagerCore.getPlugin(pluginId)
            val caretVersion = plugin?.version ?: "1.0.0"
            
            GetHostVersionResponse.newBuilder()
                .setPlatform(platformName)
                .setVersion(platformVersion)
                .setClineType("Caret for JetBrains")
                .setClineVersion(caretVersion)
                .build()
                
        } catch (e: Exception) {
            logger.error("[EnvService] getHostVersion failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
    
    override suspend fun getIdeRedirectUri(request: EmptyRequest): ClineString = withContext(Dispatchers.IO) {
        try {
            logger.info("[EnvService] getIdeRedirectUri called")
            
            // IntelliJ IDEA uses idea:// protocol
            // This will be used for deep linking back to the IDE
            val uri = "idea://caret"
            
            ClineString.newBuilder()
                .setValue(uri)
                .build()
                
        } catch (e: Exception) {
            logger.error("[EnvService] getIdeRedirectUri failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
    
    override suspend fun getTelemetrySettings(request: EmptyRequest): GetTelemetrySettingsResponse = withContext(Dispatchers.IO) {
        try {
            logger.info("[EnvService] getTelemetrySettings called")
            
            // TODO: Read actual telemetry settings from IntelliJ preferences
            // For now, return UNSUPPORTED to match proto default
            GetTelemetrySettingsResponse.newBuilder()
                .setIsEnabled(Setting.UNSUPPORTED)
                .build()
                
        } catch (e: Exception) {
            logger.error("[EnvService] getTelemetrySettings failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
    
    override fun subscribeToTelemetrySettings(request: EmptyRequest): Flow<TelemetrySettingsEvent> = callbackFlow {
        try {
            logger.info("[EnvService] subscribeToTelemetrySettings called")
            
            // TODO: Implement actual telemetry settings listener
            // For now, just send initial unsupported status
            val event = TelemetrySettingsEvent.newBuilder()
                .setIsEnabled(Setting.UNSUPPORTED)
                .build()
            
            trySend(event)
            
            awaitClose {
                logger.info("[EnvService] subscribeToTelemetrySettings stream closed")
            }
            
        } catch (e: Exception) {
            logger.error("[EnvService] subscribeToTelemetrySettings failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
    
    override suspend fun shutdown(request: EmptyRequest): Empty = withContext(Dispatchers.IO) {
        try {
            logger.info("[EnvService] shutdown requested")
            
            // Trigger graceful shutdown callback
            shutdownCallback()
            
            Empty.getDefaultInstance()
            
        } catch (e: Exception) {
            logger.error("[EnvService] shutdown failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
}
