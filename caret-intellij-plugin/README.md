# Caret IntelliJ Plugin

**IntelliJ IDEA용 AI 코딩 어시스턴트**

## 🎯 프로젝트 개요

Caret의 IntelliJ IDEA 플러그인 버전입니다. VSCode extension과 동일한 기능을 IntelliJ 플랫폼에서 제공합니다.

## 🏗️ 아키텍처

### HostBridge 패턴

VSCode extension과 동일한 gRPC 기반 HostBridge 패턴을 사용합니다:

```
IntelliJ Plugin (Kotlin)  ←→  gRPC  ←→  Caret Core (TypeScript)
```

**5개의 gRPC 서비스**:
- `WorkspaceService`: 파일/폴더 작업 (14 RPCs)
- `EnvService`: 환경 변수 관리 (4 RPCs)
- `WindowService`: UI 인터랙션 (9 RPCs)
- `DiffService`: 코드 비교 뷰 (5 RPCs)
- `TestingService`: 테스트 실행 (4 RPCs)

## 🛠️ 기술 스택

- **Language**: Kotlin 1.9+
- **Build System**: Gradle 8.5+
- **IntelliJ Platform**: 2024.1+
- **gRPC**: gRPC-Kotlin 1.4+
- **WebView**: JCEF (Java Chromium Embedded Framework)
- **Protocol Buffers**: 공유 proto 파일 (`../caret/proto/host/`)

## 📋 프로젝트 구조

```
caret-intellij-plugin/
├── src/main/kotlin/com/caretive/caret/
│   ├── hostbridge/         # gRPC HostBridge 구현
│   │   ├── server/         # gRPC 서버
│   │   └── services/       # 5개 서비스 구현
│   ├── ui/                 # JCEF WebView 통합
│   ├── actions/            # IntelliJ Actions
│   └── settings/           # 플러그인 설정
├── src/main/resources/
│   ├── META-INF/
│   │   └── plugin.xml      # 플러그인 메타데이터
│   ├── messages/           # i18n 리소스 번들
│   └── icons/              # 아이콘 에셋
├── build.gradle.kts        # Gradle 빌드 설정
└── slexn-codecenter/       # Git submodule (브랜딩 시스템)
```

## 🚀 개발 환경 설정

### 1. 사전 요구사항

```bash
# JDK 17+
java -version

# Gradle 8.5+
gradle --version

# IntelliJ IDEA 2024.1+
```

### 2. 프로젝트 설정

```bash
# 레포 클론
git clone https://github.com/aicoding-caret/caret-intellij-plugin.git
cd caret-intellij-plugin

# Submodule 초기화 (브랜딩 시스템)
git submodule update --init --recursive

# 의존성 설치 및 빌드
./gradlew build
```

### 3. 개발 실행

```bash
# IntelliJ IDE에서 플러그인 실행 (샌드박스 환경)
./gradlew runIde

# 플러그인 빌드
./gradlew buildPlugin

# 테스트 실행
./gradlew test
```

## 📦 브랜딩 시스템

slexn-codecenter submodule을 통해 멀티 브랜드 지원:

```bash
# CodeCenter 브랜드로 전환
npm run brand:codecenter

# Caret 브랜드로 복귀
npm run brand:caret

# 현재 브랜드 확인
npm run brand:status
```

**지원 브랜드**:
- **Caret**: 오픈소스 버전
- **CodeCenter**: B2B 엔터프라이즈 버전

## 🧪 테스트

```bash
# 단위 테스트
./gradlew test

# 통합 테스트
./gradlew integrationTest

# UI 테스트 (Gradle IntelliJ Plugin 제공)
./gradlew testIdeUi
```

## 📚 문서

- [아키텍처 가이드](../caret/caret-docs/work-logs/alpha/2025-10-17-intellij-phase1-architecture.md)
- [브랜딩 전략](../caret/caret-docs/work-logs/alpha/2025-10-17-intellij-branding-strategy.md)
- [HostBridge API](../caret/proto/host/)

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

Apache 2.0 License - [LICENSE](../caret/LICENSE) 파일 참조

## 🔗 관련 프로젝트

- [Caret VSCode Extension](https://github.com/aicoding-caret/caret)
- [CodeCenter Branding](https://github.com/aicoding-caret/slexn-codecenter)

---

**Made with ❤️ by Caretive**
