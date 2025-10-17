package com.caret.intellij.hostbridge.services

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.application.ReadAction
import com.intellij.openapi.command.WriteCommandAction
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.LocalFileSystem
import com.intellij.openapi.vfs.VirtualFile
import host.*
import io.grpc.Status
import io.grpc.StatusException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Implementation of WorkspaceService for IntelliJ Platform
 * 
 * Provides workspace operations like file access, diagnostics, and panel management.
 */
class WorkspaceServiceImpl(
    private val project: Project
) : WorkspaceServiceGrpcKt.WorkspaceServiceCoroutineImplBase() {
    
    private val logger = Logger.getInstance(WorkspaceServiceImpl::class.java)
    
    override suspend fun getWorkspacePaths(
        request: GetWorkspacePathsRequest
    ): GetWorkspacePathsResponse = withContext(Dispatchers.IO) {
        try {
            logger.info("[WorkspaceService] getWorkspacePaths called")
            
            val projectBasePath = project.basePath
                ?: throw StatusException(Status.NOT_FOUND.withDescription("Project base path not found"))
            
            GetWorkspacePathsResponse.newBuilder()
                .setId(project.name)
                .addPaths(projectBasePath)
                .build()
                
        } catch (e: Exception) {
            logger.error("[WorkspaceService] getWorkspacePaths failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
    
    override suspend fun saveOpenDocumentIfDirty(
        request: SaveOpenDocumentIfDirtyRequest
    ): SaveOpenDocumentIfDirtyResponse = withContext(Dispatchers.IO) {
        try {
            logger.info("[WorkspaceService] saveOpenDocumentIfDirty: ${request.filePath}")
            
            val filePath = request.filePath
                ?: throw StatusException(Status.INVALID_ARGUMENT.withDescription("file_path is required"))
            
            val virtualFile = LocalFileSystem.getInstance().findFileByPath(filePath)
                ?: return@withContext SaveOpenDocumentIfDirtyResponse.newBuilder()
                    .setWasSaved(false)
                    .build()
            
            val document = FileDocumentManager.getInstance().getDocument(virtualFile)
                ?: return@withContext SaveOpenDocumentIfDirtyResponse.newBuilder()
                    .setWasSaved(false)
                    .build()
            
            val wasDirty = FileDocumentManager.getInstance().isDocumentUnsaved(document)
            
            if (wasDirty) {
                ApplicationManager.getApplication().invokeAndWait {
                    FileDocumentManager.getInstance().saveDocument(document)
                }
                logger.info("[WorkspaceService] Document saved: $filePath")
            }
            
            SaveOpenDocumentIfDirtyResponse.newBuilder()
                .setWasSaved(wasDirty)
                .build()
                
        } catch (e: Exception) {
            logger.error("[WorkspaceService] saveOpenDocumentIfDirty failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
    
    override suspend fun getDiagnostics(
        request: GetDiagnosticsRequest
    ): GetDiagnosticsResponse = withContext(Dispatchers.IO) {
        try {
            logger.info("[WorkspaceService] getDiagnostics called")
            
            // TODO: Implement actual diagnostics collection from IntelliJ
            // This requires integrating with IntelliJ's problem/inspection system
            GetDiagnosticsResponse.newBuilder()
                .build()
                
        } catch (e: Exception) {
            logger.error("[WorkspaceService] getDiagnostics failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
    
    override suspend fun openProblemsPanel(
        request: OpenProblemsPanelRequest
    ): OpenProblemsPanelResponse = withContext(Dispatchers.IO) {
        try {
            logger.info("[WorkspaceService] openProblemsPanel called")
            
            ApplicationManager.getApplication().invokeLater {
                // Open Problems tool window in IntelliJ
                val toolWindowManager = com.intellij.openapi.wm.ToolWindowManager.getInstance(project)
                val problemsWindow = toolWindowManager.getToolWindow("Problems")
                problemsWindow?.show()
            }
            
            OpenProblemsPanelResponse.newBuilder().build()
                
        } catch (e: Exception) {
            logger.error("[WorkspaceService] openProblemsPanel failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
    
    override suspend fun openInFileExplorerPanel(
        request: OpenInFileExplorerPanelRequest
    ): OpenInFileExplorerPanelResponse = withContext(Dispatchers.IO) {
        try {
            logger.info("[WorkspaceService] openInFileExplorerPanel: ${request.path}")
            
            val virtualFile = LocalFileSystem.getInstance().findFileByPath(request.path)
                ?: throw StatusException(Status.NOT_FOUND.withDescription("File not found: ${request.path}"))
            
            ApplicationManager.getApplication().invokeLater {
                // Open Project tool window and select the file
                val toolWindowManager = com.intellij.openapi.wm.ToolWindowManager.getInstance(project)
                val projectWindow = toolWindowManager.getToolWindow("Project")
                projectWindow?.show {
                    // Select file in project view
                    com.intellij.ide.SelectInManager.getInstance(project)
                        .selectIn(virtualFile, com.intellij.ide.impl.ProjectViewSelectInTarget.ID, false)
                }
            }
            
            OpenInFileExplorerPanelResponse.newBuilder().build()
                
        } catch (e: Exception) {
            logger.error("[WorkspaceService] openInFileExplorerPanel failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
    
    override suspend fun openClineSidebarPanel(
        request: OpenClineSidebarPanelRequest
    ): OpenClineSidebarPanelResponse = withContext(Dispatchers.IO) {
        try {
            logger.info("[WorkspaceService] openClineSidebarPanel called")
            
            ApplicationManager.getApplication().invokeLater {
                // Open Caret tool window (defined in plugin.xml)
                val toolWindowManager = com.intellij.openapi.wm.ToolWindowManager.getInstance(project)
                val caretWindow = toolWindowManager.getToolWindow("Caret")
                caretWindow?.show()
            }
            
            OpenClineSidebarPanelResponse.newBuilder().build()
                
        } catch (e: Exception) {
            logger.error("[WorkspaceService] openClineSidebarPanel failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
    
    override suspend fun openTerminalPanel(
        request: OpenTerminalRequest
    ): OpenTerminalResponse = withContext(Dispatchers.IO) {
        try {
            logger.info("[WorkspaceService] openTerminalPanel called")
            
            ApplicationManager.getApplication().invokeLater {
                // Open Terminal tool window
                val toolWindowManager = com.intellij.openapi.wm.ToolWindowManager.getInstance(project)
                val terminalWindow = toolWindowManager.getToolWindow("Terminal")
                terminalWindow?.show()
            }
            
            OpenTerminalResponse.newBuilder().build()
                
        } catch (e: Exception) {
            logger.error("[WorkspaceService] openTerminalPanel failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
}
