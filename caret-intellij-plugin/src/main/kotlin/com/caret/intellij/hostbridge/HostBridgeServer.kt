package com.caret.intellij.hostbridge

import com.caret.intellij.hostbridge.services.WorkspaceServiceImpl
import com.caret.intellij.hostbridge.services.EnvServiceImpl
import com.intellij.openapi.project.Project
import io.grpc.Server
import io.grpc.ServerBuilder
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * HostBridge gRPC 서버
 * Caret Core와 IntelliJ 플러그인 간 통신을 담당
 * proto/host/*.proto 정의를 기반으로 5개 서비스 제공
 */
class HostBridgeServer(
    private val project: Project,
    private val requestedPort: Int = 0
) {
    private var server: Server? = null
    private var actualPort: Int = -1
    
    /**
     * gRPC 서버 시작
     * @return 실제 할당된 포트 번호
     */
    fun start(): Int {
        try {
            // gRPC 서버 빌드 및 시작
            server = ServerBuilder.forPort(requestedPort)
                .addService(WorkspaceServiceImpl(project))
                .addService(EnvServiceImpl(project))
                // TODO: 추후 구현
                // .addService(WindowServiceImpl(project))
                // .addService(DiffServiceImpl(project))
                // .addService(TestingServiceImpl(project))
                .build()
                .start()
            
            actualPort = server!!.port
            
            println("[Caret] HostBridge gRPC server started on port $actualPort")
            
            // JVM 종료 시 서버도 정상 종료
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
    
    /**
     * 서버 정상 종료
     */
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
    
    /**
     * 서버가 종료될 때까지 대기
     */
    fun blockUntilShutdown() {
        server?.awaitTermination()
    }
    
    /**
     * 현재 포트 번호
     */
    fun getPort(): Int = actualPort
}
