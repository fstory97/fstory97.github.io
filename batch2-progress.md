# Batch 2 Provider i18n Consolidation Progress

## 작업 대상 (5개 프로바이더)
다음 5개 프로바이더의 i18n 키를 통합 구조로 변경:

1. **DeepSeek** - 없음 (providers.deepseek 이미 존재)
2. **Gemini** - geminiProvider.* → providers.gemini.*
3. **Groq** - 없음 (providers.groq 이미 존재)
4. **AskSage** - askSageProvider.* → providers.asksage.*
5. **Doubao** - doubaoProvider.* → providers.doubao.*

## 진행 상황
- [✅] DeepSeek Provider - 이미 통합 완료
- [✅] Gemini Provider 통합 - baseUrlPlaceholder 키 이동 완료
- [✅] Groq Provider - 이미 통합 완료
- [✅] AskSage Provider 통합 - 4개 키 이동 완료
- [✅] Doubao Provider 통합 - 2개 키 이동 완료

## 배치 1 완료 확인 ✅
- SapAiCore, Anthropic, Bedrock, OpenAI Compatible, Vertex 완료
- 커밋 완료: 5ac4cf40

## 현재 상태
완료: 5/5 ✅, 현재: 배치 2 완료! 빌드 + 커밋 준비