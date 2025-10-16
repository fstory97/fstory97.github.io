# Caret VS Code 확장 초기 로딩 플로우

아래 플로우는 VS Code 환경에서 Caret 확장이 처음 로드될 때 백엔드(Extension)와 프론트엔드(Webview UI), 그리고 gRPC(ProtoBus)를 통해 어떤 단계로 초기화가 진행되는지 정리한 것이다.

## 1. 확장 진입: `activate()` 실행 (`src/extension.ts`)
- VS Code가 Caret 명령을 처음 실행하면 `activate()`가 호출되고, `setupHostProvider(context)`로 플랫폼별 의존성 컨테이너를 구성한다.
  - `HostProvider.initialize`는 `VscodeWebviewProvider`/`VscodeDiffViewProvider` 팩토리와 `vscodeHostBridgeClient`를 등록해, 이후 코드가 플랫폼에 독립적으로 `HostProvider.*` API를 사용할 수 있게 한다.
  - `vscodeHostBridgeClient`는 VS Code API를 gRPC 형식으로 감싼 클라이언트(`src/hosts/vscode/hostbridge`)로, 머신 ID 조회, 메시지 표시 등 호스트 명령을 비동기로 호출한다.
- 공통 초기화 함수 `initialize(context)` (`src/common.ts`)가 실행되며 다음을 처리한다.
  - `HostProvider.env.getMachineId` 호출로 PostHog 식별자를 확보(호스트 gRPC 사용).
  - 마이그레이션 및 캐시 정리 (`migrateCustomInstructionsToGlobalRules`, `FileContextTracker.cleanupOrphanedWarnings` 등).
  - `HostProvider.get().createWebviewProvider(WebviewProviderType.SIDEBAR)`로 기본 웹뷰 프로바이더를 미리 준비한다.
- Caret 특화 초기화가 이어진다.
  - `CaretProviderWrapper`로 기존 `VscodeWebviewProvider`를 감싸 이미지/페르소나 자산을 주입.
  - `CaretGlobalManager.initialize`로 전역 모드(`caret`/`cline`)와 사용자 하이브리드 상태를 준비.
  - `CaretModeManager.setContext`, `JsonTemplateLoader.initialize`, `PersonaInitializer.initialize` 등 Caret 전용 서비스가 동작한다.
- 이 시점에 VS Code 명령, 버튼 이벤트, 테스트 모드 워처가 등록되지만 실제 웹뷰는 아직 화면에 렌더되지 않았다.

## 2. 웹뷰 프로바이더 인스턴스 구성 (`src/hosts/vscode/VscodeWebviewProvider.ts` & `caret-src/core/webview/CaretProviderWrapper.ts`)
- 사용자가 사이드바를 열거나 확장이 탭을 생성하면 VS Code가 `CaretProviderWrapper.resolveWebviewView`를 호출한다.
  1. 내부의 `VscodeWebviewProvider.resolveWebviewView`가 실행되어 HTML/CSP를 세팅하고, `handleWebviewMessage`를 통해 웹뷰 메시지를 gRPC 라우터(`handleGrpcRequest`)에 연결한다.
  2. Caret 래퍼가 HTML에 템플릿 캐릭터, 페르소나 이미지를 Base64로 주입하고, 추가 메시지 핸들링 훅을 등록한다.
- `WebviewProvider` 기본 클래스는 생성 시마다 고유 `clientId`를 부여하고 `Controller` 인스턴스를 만든다. 이 `Controller`가 이후 모든 비즈니스 로직과 상태 관리를 담당한다.

## 3. 컨트롤러와 상태 매니저 초기화 (`src/core/controller/index.ts`, `src/core/storage/StateManager.ts`)
- `Controller` 생성자는 다음을 즉시 수행한다.
  - `StateManager.initialize()`를 비동기로 호출해 전역/워크스페이스/비밀 스토리지를 메모리 캐시로 로드하고, 기본 API 프로바이더를 설정한다.
  - `AuthService`, `ClineAccountService`, `McpHub` 등을 준비하고, 캐시 초기화가 끝난 뒤 `authService.restoreRefreshTokenAndRetrieveAuthInfo()`로 인증 정보를 복원한다.
  - 퍼시스턴스 에러 처리를 등록하고, 향후 상태 변경 시 `postStateToWebview()`를 통해 웹뷰로 JSON 상태를 전송할 수 있게 한다.

## 4. 웹뷰 프론트엔드 부트스트랩 (`webview-ui/src/main.tsx`, `App.tsx`)
- 웹뷰 HTML이 로드되면 Vite로 번들된 `index.js`가 실행되고 `App` 컴포넌트가 렌더된다.
- `ExtensionStateContextProvider`가 핵심 초기화 훅을 담당한다.
  - `window.WEBVIEW_PROVIDER_TYPE`, `window.clineClientId` 같은 부트스트랩 값(확장에서 주입)을 읽는다.
  - `StateServiceClient.subscribeToState` 등 gRPC 스트림 구독을 설정하고, `UiServiceClient.initializeWebview`를 즉시 호출해 백엔드 초기화 루틴을 트리거한다.
  - `CaretSystemServiceClient.GetPromptSystemMode`로 백엔드의 Caret 모드 설정을 받아와 로컬 상태와 동기화한다.
- `Providers` 트리 안에서는 PostHog, HeroUI, Caret I18n/State 컨텍스트가 준비되어 이후 UI 전역 상태가 반응형으로 관리된다.

## 5. ProtoBus gRPC 메시지 흐름
1. 프론트엔드에서 gRPC 클라이언트(`webview-ui/src/services/grpc-client.ts`)를 호출하면 `ProtoBusClient` (`grpc-client-base.ts`)가 메시지를 직렬화해 `vscode.postMessage`로 확장 측에 전달한다.
2. `VscodeWebviewProvider.handleWebviewMessage`가 메시지를 받으면 `handleGrpcRequest` (`src/core/controller/grpc-handler.ts`)를 통해 `serviceHandlers` (`src/generated/hosts/vscode/protobus-services.ts`)에 등록된 컨트롤러 함수로 라우팅한다.
3. 언어/스트리밍 여부에 따라 응답을 다시 웹뷰로 브로드캐스트하고, 스트림은 `GrpcRequestRegistry`로 수명 주기를 관리한다.
4. 상태 구독 같은 스트리밍 요청은 `subscribeToState`(`src/core/controller/state/subscribeToState.ts`)가 즉시 현재 상태를 JSON으로 보내고, 이후 `Controller.postStateToWebview`가 호출될 때마다 동일한 스트림으로 변경분을 푸시한다.

## 6. 초기 데이터 동기화 시퀀스
1. **State 구독**: 웹뷰 마운트 후 `StateServiceClient.subscribeToState` → 확장 측 `subscribeToState`가 초기 `ExtensionState` JSON을 전달 → React 상태가 `didHydrateState = true`로 전환되고 Welcome/Announcement 등 표시 여부를 결정한다.
2. **웹뷰 초기화**: `UiServiceClient.initializeWebview` → `initializeWebview` (`src/core/controller/ui/initializeWebview.ts`)가 실행되어 모델 목록/마켓플레이스/텔레메트리 플래그를 최신화하고, 필요 시 `stateManager.setApiConfiguration` 후 `postStateToWebview`로 다시 상태를 푸시한다.
3. **추가 스트림**: `UiServiceClient.subscribeToMcpButtonClicked`, `subscribeToDidBecomeVisible`, `McpServiceClient.subscribeToMcpServers` 등 다수의 스트림이 열려 UI 이벤트와 백엔드 상태가 즉시 동기화되도록 한다.
4. **호스트 상호작용**: `initialize` 단계에서 이미 `HostProvider.workspace.openClineSidebarPanel`, `HostProvider.window.showMessage` 등을 통해 VS Code UI와 상호 작용할 준비가 되어 있으며, 필요 시 gRPC를 통해 호출된다.

## 7. 전체 순서 요약
1. VS Code가 `activate()`를 호출하고 HostProvider, Caret 서비스, 웹뷰 프로바이더를 준비한다.
2. 사용자가 사이드바/탭을 열면 `CaretProviderWrapper`가 `VscodeWebviewProvider`를 통해 HTML을 주입하고 메시지 브릿지를 구성한다.
3. `WebviewProvider` 생성과 동시에 `Controller`가 상태 캐시(`StateManager`)를 초기화하고 백엔드 서비스를 기동한다.
4. 웹뷰 JS가 로드되어 gRPC 스트림을 구독하고, 초기 상태/설정/모델 데이터를 백엔드와 동기화한다.
5. 이후 모든 UI 상호작용은 ProtoBus gRPC를 통해 컨트롤러와 통신하며, `CaretGlobalManager`/`PersonaInitializer` 등 Caret 전용 로직이 사용자 경험을 확장한다.

이 구조 덕분에 Caret은 VS Code 확장과 웹뷰 사이에서 일관된 gRPC 기반 메시지 흐름을 유지하면서도, Caret 전용 모드/페르소나/브랜딩 기능을 초기 로딩 단계에서 자연스럽게 통합한다.
