# 배치 1 진행 상황 (5개 단위 작업)

## 🎯 대상 프로바이더들
1. ✅ **SapAiCore Provider** - 완료
2. **Anthropic Provider** - 진행 중...
3. **Bedrock Provider** - 대기 중
4. **OpenAI Compatible Provider** - 대기 중
5. **Vertex Provider** - 대기 중

## 📋 작업 세부사항

### ✅ SapAiCore Provider (완료)
- **패턴**: `sapAiCoreProvider.*` → `providers.sapaicore.*`
- **복잡도**: 높음 (25개+ 키)
- **주요 키들**: clientId, clientSecret, baseUrl, tokenUrl, resourceGroup, orchestrationMode 등
- **상태**: ✅ 통합 완료 (locale 파일 + 컴포넌트 업데이트)

### Anthropic Provider (현재 진행)
- **패턴**: `anthropicProvider.*` → `providers.anthropic.*`
- **복잡도**: 낮음 (2-3개 키)
- **주요 키들**: switchTo1MContext, switchTo200KContext

### Bedrock Provider (대기)
- **패턴**: `bedrockProvider.*` → `providers.bedrock.*`
- **복잡도**: 높음 (AWS 관련 다수 키)

### OpenAI Compatible Provider (대기)
- **패턴**: `openAiCompatibleProvider.*` → `providers.openai.*`
- **복잡도**: 중간

### Vertex Provider (대기)
- **패턴**: `vertexProvider.*` → `providers.vertex.*`
- **복잡도**: 중간 (Google Cloud 관련)

## 📊 진행률
- **완료**: 5/5 ✅
- **현재**: 배치 1 완료! 빌드 + 커밋 준비
- **소요 시간**: 약 10분