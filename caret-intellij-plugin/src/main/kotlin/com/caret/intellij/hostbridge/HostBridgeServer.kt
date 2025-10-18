package com.caret.intellij.hostbridge

import com.caret.intellij.hostbridge.services.WorkspaceServiceImpl
import com.caret.intellij.hostbridge.services.EnvServiceImpl
import com.caret.intellij.hostbridge.services.WindowServiceImpl
import com.caret.intellij.hostbridge.services.DiffServiceImpl
import com.intellij.openapi.project.Project
import io.grpc.Server
import io.grpc.ServerBuilder
import java.io.IOException
import java.util.concurrent.TimeUnit

class HostBridgeServer(
    private val project: Project,
    private val requestedPort: Int = 0
) {
    private var server: Server? = null
    private var actualPort: Int = -1
    
    lateinit var workspaceService: WorkspaceServiceImpl
        private set
    lateinit var envService: EnvServiceImpl
        private set
    lateinit var windowService: WindowServiceImpl
        private set
    lateinit var diffService: DiffServiceImpl
        private set
    
    fun start(): Int {
        try {
            workspaceService = WorkspaceServiceImpl(project)
            envService = EnvServiceImpl(shutdownCallback = { shutdown() })
            windowService = WindowServiceImpl(project)
            diffService = DiffServiceImpl(project)
            
            server = ServerBuilder.forPort(requestedPort)
                .addService(workspaceService)
                .addService(envService)
                .addService(windowService)
                .addService(diffService)
                .build()
                .start()
            
            actualPort = server!!.port
            
            println("[Caret] HostBridge gRPC server started on port $actualPort")
            
            Runtime.getRuntime().addShutdownHook(object : Thread() {
                override fun run() {
                    System.err.println("[Caret] Shutting down HostBridge server...")
                    this@HostBridgeServer.shutdown()
                    System.err.println("[Caret] HostBridge server shut down")
                }
            })
            
            return actualPort
        } catch (e: IOException) {
            throw RuntimeException("Failed to start HostBridge server", e)
        }
    }
    
    fun shutdown() {
        server?.let {
            it.shutdown()
            try {
                if (!it.awaitTermination(5, TimeUnit.SECONDS)) {
                    it.shutdownNow()
                    if (!it.awaitTermination(5, TimeUnit.SECONDS)) {
                        System.err.println("[Caret] HostBridge server did not terminate")
                    }
                }
            } catch (e: InterruptedException) {
                it.shutdownNow()
                Thread.currentThread().interrupt()
            }
        }
    }
    
    fun blockUntilShutdown() {
        server?.awaitTermination()
    }
    
    fun getPort(): Int = actualPort
}
