package com.caret.intellij.services

import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import com.caret.intellij.hostbridge.HostBridgeServer
import com.intellij.openapi.Disposable

/**
 * Caret 프로젝트 레벨 서비스
 * 각 프로젝트마다 하나의 인스턴스가 생성됨
 * HostBridge gRPC 서버를 관리
 */
@Service(Service.Level.PROJECT)
class CaretProjectService(private val project: Project) : Disposable {
    
    private var hostBridgeServer: HostBridgeServer? = null
    private var isStarted = false
    
    /**
     * HostBridge 서버 시작
     * Caret Core와 통신을 위한 gRPC 서버 실행
     */
    fun startHostBridge(port: Int = 0): Int {
        if (isStarted) {
            return hostBridgeServer?.getPort() ?: -1
        }
        
        hostBridgeServer = HostBridgeServer(project, port)
        val actualPort = hostBridgeServer!!.start()
        isStarted = true
        
        println("[Caret] HostBridge server started on port $actualPort")
        return actualPort
    }
    
    /**
     * HostBridge 서버 중지
     */
    fun stopHostBridge() {
        if (!isStarted) return
        
        hostBridgeServer?.shutdown()
        hostBridgeServer = null
        isStarted = false
        
        println("[Caret] HostBridge server stopped")
    }
    
    /**
     * HostBridge 서버 실행 여부
     */
    fun isHostBridgeRunning(): Boolean = isStarted
    
    /**
     * 현재 HostBridge 포트 번호
     */
    fun getHostBridgePort(): Int = hostBridgeServer?.getPort() ?: -1
    
    /**
     * 프로젝트 종료 시 자동으로 호출됨
     */
    override fun dispose() {
        stopHostBridge()
    }
    
    companion object {
        fun getInstance(project: Project): CaretProjectService {
            return project.getService(CaretProjectService::class.java)
        }
    }
}
