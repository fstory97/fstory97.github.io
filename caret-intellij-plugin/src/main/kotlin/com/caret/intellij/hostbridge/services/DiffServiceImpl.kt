package com.caret.intellij.hostbridge.services

import bot.cline.host.proto.*
import com.intellij.diff.DiffContentFactory
import com.intellij.diff.DiffManager
import com.intellij.diff.contents.DocumentContent
import com.intellij.diff.requests.SimpleDiffRequest
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.editor.Document
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.ScrollType
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.LocalFileSystem
import io.grpc.Status
import io.grpc.StatusException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.ConcurrentHashMap
import java.util.UUID

data class DiffViewState(
    val diffId: String,
    val path: String,
    val document: Document,
    val editor: Editor?
)

class DiffServiceImpl(private val project: Project) : DiffServiceGrpcKt.DiffServiceCoroutineImplBase() {
    
    private val logger = Logger.getInstance(DiffServiceImpl::class.java)
    private val diffViews = ConcurrentHashMap<String, DiffViewState>()

    override suspend fun openDiff(
        request: OpenDiffRequest
    ): OpenDiffResponse = withContext(Dispatchers.IO) {
        try {
            val path = request.path ?: throw StatusException(
                Status.INVALID_ARGUMENT.withDescription("Path is required")
            )
            val newContent = request.content ?: ""
            
            val file = LocalFileSystem.getInstance().findFileByPath(path)
            val oldContent = if (file != null) {
                val document = FileDocumentManager.getInstance().getDocument(file)
                document?.text ?: ""
            } else {
                ""
            }
            
            val diffId = UUID.randomUUID().toString()
            
            ApplicationManager.getApplication().invokeLater {
                try {
                    val contentFactory = DiffContentFactory.getInstance()
                    val leftContent = contentFactory.create(project, oldContent)
                    val rightContent = contentFactory.create(project, newContent)
                    
                    val diffRequest = SimpleDiffRequest(
                        "Diff: $path",
                        leftContent,
                        rightContent,
                        "Original",
                        "Modified"
                    )
                    
                    DiffManager.getInstance().showDiff(project, diffRequest)
                    
                    if (rightContent is DocumentContent) {
                        val document = rightContent.document
                        val fileEditorManager = FileEditorManager.getInstance(project)
                        val editor = fileEditorManager.selectedTextEditor
                        
                        diffViews[diffId] = DiffViewState(diffId, path, document, editor)
                    }
                } catch (e: Exception) {
                    logger.error("[DiffService] Failed to show diff view", e)
                }
            }
            
            OpenDiffResponse.newBuilder()
                .setDiffId(diffId)
                .build()
        } catch (e: Exception) {
            logger.error("[DiffService] openDiff failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun getDocumentText(
        request: GetDocumentTextRequest
    ): GetDocumentTextResponse = withContext(Dispatchers.IO) {
        try {
            val diffId = request.diffId ?: throw StatusException(
                Status.INVALID_ARGUMENT.withDescription("diffId is required")
            )
            
            val diffView = diffViews[diffId] ?: throw StatusException(
                Status.NOT_FOUND.withDescription("Diff view not found: $diffId")
            )
            
            val content = diffView.document.text
            
            GetDocumentTextResponse.newBuilder()
                .setContent(content)
                .build()
        } catch (e: Exception) {
            logger.error("[DiffService] getDocumentText failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun replaceText(
        request: ReplaceTextRequest
    ): ReplaceTextResponse = withContext(Dispatchers.IO) {
        try {
            val diffId = request.diffId ?: throw StatusException(
                Status.INVALID_ARGUMENT.withDescription("diffId is required")
            )
            
            val diffView = diffViews[diffId] ?: throw StatusException(
                Status.NOT_FOUND.withDescription("Diff view not found: $diffId")
            )
            
            val document = diffView.document
            val content = request.content ?: ""
            val startLine = request.startLine
            val endLine = request.endLine
            
            ApplicationManager.getApplication().runWriteAction {
                if (startLine > 0 && endLine > 0) {
                    val startOffset = document.getLineStartOffset(startLine - 1)
                    val endOffset = document.getLineEndOffset(endLine - 1)
                    document.replaceString(startOffset, endOffset, content)
                } else {
                    document.setText(content)
                }
            }
            
            ReplaceTextResponse.newBuilder().build()
        } catch (e: Exception) {
            logger.error("[DiffService] replaceText failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun scrollDiff(
        request: ScrollDiffRequest
    ): ScrollDiffResponse = withContext(Dispatchers.IO) {
        try {
            val diffId = request.diffId ?: throw StatusException(
                Status.INVALID_ARGUMENT.withDescription("diffId is required")
            )
            
            val diffView = diffViews[diffId] ?: throw StatusException(
                Status.NOT_FOUND.withDescription("Diff view not found: $diffId")
            )
            
            val editor = diffView.editor ?: throw StatusException(
                Status.FAILED_PRECONDITION.withDescription("No editor available for diff view")
            )
            
            val line = request.line
            
            ApplicationManager.getApplication().invokeLater {
                val lineCount = editor.document.lineCount
                if (line in 0 until lineCount) {
                    val offset = editor.document.getLineStartOffset(line)
                    editor.caretModel.moveToOffset(offset)
                    editor.scrollingModel.scrollToCaret(ScrollType.CENTER)
                }
            }
            
            ScrollDiffResponse.newBuilder().build()
        } catch (e: Exception) {
            logger.error("[DiffService] scrollDiff failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun truncateDocument(
        request: TruncateDocumentRequest
    ): TruncateDocumentResponse = withContext(Dispatchers.IO) {
        try {
            val diffId = request.diffId ?: throw StatusException(
                Status.INVALID_ARGUMENT.withDescription("diffId is required")
            )
            
            val diffView = diffViews[diffId] ?: throw StatusException(
                Status.NOT_FOUND.withDescription("Diff view not found: $diffId")
            )
            
            val document = diffView.document
            val endLine = request.endLine
            
            ApplicationManager.getApplication().runWriteAction {
                if (endLine > 0 && endLine < document.lineCount) {
                    val endOffset = document.getLineEndOffset(endLine - 1)
                    document.deleteString(endOffset, document.textLength)
                }
            }
            
            TruncateDocumentResponse.newBuilder().build()
        } catch (e: Exception) {
            logger.error("[DiffService] truncateDocument failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun saveDocument(
        request: SaveDocumentRequest
    ): SaveDocumentResponse = withContext(Dispatchers.IO) {
        try {
            val diffId = request.diffId ?: throw StatusException(
                Status.INVALID_ARGUMENT.withDescription("diffId is required")
            )
            
            val diffView = diffViews[diffId] ?: throw StatusException(
                Status.NOT_FOUND.withDescription("Diff view not found: $diffId")
            )
            
            val document = diffView.document
            val path = diffView.path
            
            val file = LocalFileSystem.getInstance().findFileByPath(path)
            if (file != null && file.isWritable) {
                ApplicationManager.getApplication().runWriteAction {
                    val content = document.text
                    file.setBinaryContent(content.toByteArray())
                }
            } else {
                throw StatusException(
                    Status.FAILED_PRECONDITION.withDescription("File is not writable: $path")
                )
            }
            
            SaveDocumentResponse.newBuilder().build()
        } catch (e: Exception) {
            logger.error("[DiffService] saveDocument failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun closeAllDiffs(
        request: CloseAllDiffsRequest
    ): CloseAllDiffsResponse = withContext(Dispatchers.IO) {
        try {
            diffViews.clear()
            
            CloseAllDiffsResponse.newBuilder().build()
        } catch (e: Exception) {
            logger.error("[DiffService] closeAllDiffs failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }

    override suspend fun openMultiFileDiff(
        request: OpenMultiFileDiffRequest
    ): OpenMultiFileDiffResponse = withContext(Dispatchers.IO) {
        try {
            val title = request.title ?: "Multi-File Diff"
            val diffs = request.diffsList
            
            if (diffs.isEmpty()) {
                throw StatusException(
                    Status.INVALID_ARGUMENT.withDescription("At least one diff is required")
                )
            }
            
            ApplicationManager.getApplication().invokeLater {
                try {
                    val contentFactory = DiffContentFactory.getInstance()
                    
                    for (diff in diffs) {
                        val filePath = diff.filePath ?: continue
                        val leftContent = contentFactory.create(project, diff.leftContent ?: "")
                        val rightContent = contentFactory.create(project, diff.rightContent ?: "")
                        
                        val diffRequest = SimpleDiffRequest(
                            "$title - $filePath",
                            leftContent,
                            rightContent,
                            "Before",
                            "After"
                        )
                        
                        DiffManager.getInstance().showDiff(project, diffRequest)
                    }
                } catch (e: Exception) {
                    logger.error("[DiffService] Failed to show multi-file diff", e)
                }
            }
            
            OpenMultiFileDiffResponse.newBuilder().build()
        } catch (e: Exception) {
            logger.error("[DiffService] openMultiFileDiff failed", e)
            throw StatusException(Status.INTERNAL.withDescription(e.message))
        }
    }
}
