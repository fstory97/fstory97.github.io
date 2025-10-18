import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("java")
    id("org.jetbrains.kotlin.jvm") version "1.9.22"
    id("org.jetbrains.intellij") version "1.17.0"
    id("com.google.protobuf") version "0.9.4"
}

group = "com.caretive"
version = "1.0.0"

repositories {
    mavenCentral()
    google()
}

dependencies {
    // Kotlin
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    
    // gRPC
    implementation("io.grpc:grpc-kotlin-stub:1.4.1")
    implementation("io.grpc:grpc-protobuf:1.60.0")
    implementation("io.grpc:grpc-netty:1.60.0")
    implementation("com.google.protobuf:protobuf-kotlin:3.25.1")
    
    // Protocol Buffers
    implementation("com.google.protobuf:protobuf-java:3.25.1")
    
    // Logging
    implementation("io.github.microutils:kotlin-logging-jvm:3.0.5")
    implementation("ch.qos.logback:logback-classic:1.4.14")
    
    // JSON serialization
    implementation("com.google.code.gson:gson:2.10.1")
    
    // Testing
    testImplementation("org.jetbrains.kotlin:kotlin-test")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testImplementation("io.grpc:grpc-testing:1.60.0")
}

// IntelliJ Platform Plugin Configuration
intellij {
    version.set("2024.1")
    type.set("IC") // IntelliJ IDEA Community Edition
    
    plugins.set(listOf(
        "com.intellij.java",
        "org.jetbrains.kotlin"
    ))
}

// Protocol Buffers Configuration
protobuf {
    protoc {
        artifact = "com.google.protobuf:protoc:3.25.1"
    }
    plugins {
        create("grpc") {
            artifact = "io.grpc:protoc-gen-grpc-java:1.60.0"
        }
        create("grpckt") {
            artifact = "io.grpc:protoc-gen-grpc-kotlin:1.4.1:jdk8@jar"
        }
    }
    generateProtoTasks {
        all().forEach { task ->
            task.plugins {
                create("grpc")
                create("grpckt")
            }
            task.builtins {
                create("kotlin")
            }
        }
    }
}

// Source Sets Configuration
sourceSets {
    main {
        proto {
            // Shared proto files from caret main repo
            srcDir("../proto/host")
        }
        java {
            srcDirs("build/generated/source/proto/main/grpc")
            srcDirs("build/generated/source/proto/main/grpckt")
            srcDirs("build/generated/source/proto/main/java")
            srcDirs("build/generated/source/proto/main/kotlin")
        }
        resources {
            // Include Caret Core (TypeScript) bundled executable
            srcDir("../dist") {
                include("extension.js")
                into("caret-core")
            }
            // Include WebView UI build artifacts
            srcDir("../webview-ui/build") {
                into("webview")
            }
        }
    }
}

tasks {
    // Set the JVM compatibility versions
    withType<JavaCompile> {
        sourceCompatibility = "17"
        targetCompatibility = "17"
    }
    
    withType<KotlinCompile> {
        kotlinOptions.jvmTarget = "17"
        kotlinOptions.freeCompilerArgs += listOf(
            "-Xjsr305=strict",
            "-opt-in=kotlin.RequiresOptIn"
        )
    }
    
    patchPluginXml {
        sinceBuild.set("241")
        untilBuild.set("243.*")
        
        // Plugin metadata (will be overridden by branding system)
        pluginDescription.set("""
            <h1>Caret - AI Coding Assistant for IntelliJ</h1>
            <p>
                Autonomous AI coding assistant that can create/edit files, 
                execute terminal commands, and use browser automation - 
                all within your IntelliJ IDE.
            </p>
            <h2>Features</h2>
            <ul>
                <li>✨ Multi-model AI support (Claude, GPT-4, DeepSeek, etc.)</li>
                <li>📝 Autonomous file editing with smart diffs</li>
                <li>💻 Terminal command execution</li>
                <li>🌐 Browser automation</li>
                <li>🔧 MCP (Model Context Protocol) integration</li>
                <li>🎯 Task-oriented workflow</li>
            </ul>
        """.trimIndent())
        
        changeNotes.set("""
            <h3>1.0.0</h3>
            <ul>
                <li>Initial release</li>
                <li>HostBridge gRPC integration</li>
                <li>JCEF WebView support</li>
                <li>Multi-brand support (Caret/CodeCenter)</li>
            </ul>
        """.trimIndent())
    }
    
    signPlugin {
        certificateChain.set(System.getenv("CERTIFICATE_CHAIN"))
        privateKey.set(System.getenv("PRIVATE_KEY"))
        password.set(System.getenv("PRIVATE_KEY_PASSWORD"))
    }
    
    publishPlugin {
        token.set(System.getenv("PUBLISH_TOKEN"))
    }
    
    test {
        useJUnitPlatform()
    }
    
    // Custom task: Generate proto files before build
    named("compileKotlin") {
        dependsOn("generateProto")
    }
    
    // Custom task: Check proto file changes
    register("checkProtoChanges") {
        doLast {
            val protoDir = file("../proto/host")
            if (!protoDir.exists()) {
                throw GradleException(
                    "Proto directory not found: ${protoDir.absolutePath}\n" +
                    "Please ensure you are in caret project (caret-intellij-plugin is a subfolder)"
                )
            }
            println("✅ Proto files found: ${protoDir.listFiles()?.size ?: 0} files")
        }
    }
    
    // Custom task: Verify Caret Core build
    register("checkCaretCore") {
        doLast {
            val caretCore = file("../dist/extension.js")
            val webviewBuild = file("../webview-ui/build/index.html")
            
            if (!caretCore.exists()) {
                throw GradleException(
                    "Caret Core not found: ${caretCore.absolutePath}\n" +
                    "Please build caret project first: npm run compile"
                )
            }
            
            if (!webviewBuild.exists()) {
                throw GradleException(
                    "WebView UI not found: ${webviewBuild.absolutePath}\n" +
                    "Please build webview: npm run build:webview"
                )
            }
            
            println("✅ Caret Core: ${caretCore.name} (${caretCore.length() / 1024} KB)")
            println("✅ WebView UI: ${webviewBuild.parentFile.listFiles()?.size ?: 0} files")
        }
    }
}

// Build verification
tasks.register("verifyBuild") {
    dependsOn("checkProtoChanges", "checkCaretCore", "build", "test")
    doLast {
        println("✅ Build verification completed!")
        println("   - Proto files: OK")
        println("   - Caret Core: OK")
        println("   - WebView UI: OK")
        println("   - Compilation: OK")
        println("   - Tests: OK")
    }
}

// Gradle task: Build Caret Core (helper)
tasks.register<Exec>("buildCaretCore") {
    workingDir("..")
    commandLine("npm", "run", "compile")
    
    doLast {
        println("✅ Caret Core built successfully")
    }
}

// Gradle task: Build WebView UI (helper)
tasks.register<Exec>("buildWebViewUI") {
    workingDir("..")
    commandLine("npm", "run", "build:webview")
    
    doLast {
        println("✅ WebView UI built successfully")
    }
}
