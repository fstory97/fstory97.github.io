package com.caret.intellij.hostbridge.services

import bot.cline.host.proto.*
import com.intellij.ide.BrowserUtil
import com.intellij.notification.Notification
import com.intellij.notification.NotificationType
import com.intellij.notification.Notifications
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.fileChooser.FileChooser
import com.intellij.openapi.fileChooser.FileChooserDescriptor
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.intellij.openapi.vfs.LocalFileSystem
import com.intellij.openapi.wm.WindowManager
import io.grpc.Status
import io.grpc.StatusException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class WindowServiceImpl(private val project: Project) : WindowServiceGrpcKt.WindowServiceCoroutineImplBase() {
    
    private val logger = Logger.getInstance(WindowServiceImpl::class.java)

    override suspend fun showTextDocument(
        request: ShowTextDocumentRequest
    ): TextEditorInfo = withContext(Dispatchers.IO) {
        try {
            val file = LocalFileSystem.getInstance().findFileByPath(request.path)
            if (file != null) {
                val fileEditorManager = FileEditorManager.getInstance(project)
                val editors = fileEditorManager.openFile(file, true)
                
                TextEditorInfo.newBuilder()
                    .setDocumentPath(request.path)
                    .setIsActive(editors.isNotEmpty())
                    .build()
            } else {
                throw StatusException(Status.NOT_FOUND.withDescription("File not found: ${request.path}"))
            }
        } catch (e: Exception) {
            logger.error("[WindowService] showTextDocument failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun showOpenDialogue(
        request: ShowOpenDialogueRequest
    ): SelectedResources = withContext(Dispatchers.IO) {
        try {
            val descriptor = FileChooserDescriptor(
                true,  // chooseFiles
                true,  // chooseFolders
                false, // chooseJars
                false, // chooseJarsAsFiles
                false, // chooseJarContents
                request.canSelectMany ?: false  // chooseMultiple
            )
            
            if (request.hasOpenLabel()) {
                descriptor.title = request.openLabel
            }
            
            val selectedFiles = FileChooser.chooseFiles(descriptor, project, null)
            val paths = selectedFiles.map { it.path }
            
            SelectedResources.newBuilder()
                .addAllPaths(paths)
                .build()
        } catch (e: Exception) {
            logger.error("[WindowService] showOpenDialogue failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun showMessage(
        request: ShowMessageRequest
    ): SelectedResponse = withContext(Dispatchers.IO) {
        try {
            val notificationType = when (request.type) {
                ShowMessageType.ERROR -> NotificationType.ERROR
                ShowMessageType.WARNING -> NotificationType.WARNING
                ShowMessageType.INFORMATION -> NotificationType.INFORMATION
                else -> NotificationType.INFORMATION
            }
            
            val notification = Notification(
                "Caret",
                "Caret",
                request.message,
                notificationType
            )
            
            Notifications.Bus.notify(notification, project)
            
            SelectedResponse.newBuilder().build()
        } catch (e: Exception) {
            logger.error("[WindowService] showMessage failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun showInputBox(
        request: ShowInputBoxRequest
    ): ShowInputBoxResponse = withContext(Dispatchers.IO) {
        try {
            val result = Messages.showInputDialog(
                project,
                request.prompt ?: "",
                request.title,
                null,
                request.value ?: "",
                null
            )
            
            ShowInputBoxResponse.newBuilder().apply {
                if (result != null) {
                    this.response = result
                }
            }.build()
        } catch (e: Exception) {
            logger.error("[WindowService] showInputBox failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun showSaveDialog(
        request: ShowSaveDialogRequest
    ): ShowSaveDialogResponse = withContext(Dispatchers.IO) {
        try {
            val descriptor = FileChooserDescriptor(
                false, // chooseFiles
                false, // chooseFolders
                false, // chooseJars
                false, // chooseJarsAsFiles
                false, // chooseJarContents
                false  // chooseMultiple
            ).withTitle("Save File")
            
            val selectedFiles = FileChooser.chooseFiles(descriptor, project, null)
            
            ShowSaveDialogResponse.newBuilder().apply {
                if (selectedFiles.isNotEmpty()) {
                    selectedPath = selectedFiles[0].path
                }
            }.build()
        } catch (e: Exception) {
            logger.error("[WindowService] showSaveDialog failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun openFile(
        request: OpenFileRequest
    ): OpenFileResponse = withContext(Dispatchers.IO) {
        try {
            val file = LocalFileSystem.getInstance().findFileByPath(request.filePath)
            if (file != null) {
                ApplicationManager.getApplication().invokeLater {
                    FileEditorManager.getInstance(project).openFile(file, true)
                }
                OpenFileResponse.newBuilder().build()
            } else {
                throw StatusException(Status.NOT_FOUND.withDescription("File not found: ${request.filePath}"))
            }
        } catch (e: Exception) {
            logger.error("[WindowService] openFile failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun openSettings(
        request: OpenSettingsRequest
    ): OpenSettingsResponse = withContext(Dispatchers.IO) {
        try {
            OpenSettingsResponse.newBuilder().build()
        } catch (e: Exception) {
            logger.error("[WindowService] openSettings failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun getOpenTabs(
        request: GetOpenTabsRequest
    ): GetOpenTabsResponse = withContext(Dispatchers.IO) {
        try {
            val fileEditorManager = FileEditorManager.getInstance(project)
            val openFiles = fileEditorManager.openFiles
            val paths = openFiles.map { it.path }
            
            GetOpenTabsResponse.newBuilder()
                .addAllPaths(paths)
                .build()
        } catch (e: Exception) {
            logger.error("[WindowService] getOpenTabs failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun getVisibleTabs(
        request: GetVisibleTabsRequest
    ): GetVisibleTabsResponse = withContext(Dispatchers.IO) {
        try {
            val fileEditorManager = FileEditorManager.getInstance(project)
            val selectedFiles = fileEditorManager.selectedFiles
            val paths = selectedFiles.map { it.path }
            
            GetVisibleTabsResponse.newBuilder()
                .addAllPaths(paths)
                .build()
        } catch (e: Exception) {
            logger.error("[WindowService] getVisibleTabs failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun getActiveEditor(
        request: GetActiveEditorRequest
    ): GetActiveEditorResponse = withContext(Dispatchers.IO) {
        try {
            val fileEditorManager = FileEditorManager.getInstance(project)
            val selectedEditor = fileEditorManager.selectedEditor
            val currentFile = selectedEditor?.file
            
            GetActiveEditorResponse.newBuilder().apply {
                if (currentFile != null) {
                    filePath = currentFile.path
                }
            }.build()
        } catch (e: Exception) {
            logger.error("[WindowService] getActiveEditor failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
}
