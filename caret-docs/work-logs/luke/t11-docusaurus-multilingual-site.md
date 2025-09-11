# T11: Docusaurus 다국어 문서 사이트 구축

## 1. 목표
- `/docs` 폴더의 기존 CLINE 문서를 Docusaurus 사이트로 구축
- 영어, 한국어, 중국어, 일본어 다국어 지원 (URL 기반 분기)
- Caret 브랜딩 적용 (Caretive INC 풋터 포함)

## 2. 최종 구조 (깔끔한 URL 방식)
- `http://localhost:3000/` - 메인 랜딩 페이지 (다국어 링크)
- `http://localhost:3000/en` - 영어 문서
- `http://localhost:3000/ko` - 한국어 문서 
- `http://localhost:3000/zh` - 중국어 문서
- `http://localhost:3000/ja` - 일본어 문서

## 3. 구현 방식
- **Docusaurus는 MDX 뷰어로만 사용**
- **언어별 독립 사이트로 구성** (복잡한 i18n 설정 없이)
- **메인 페이지에 언어 선택 링크**
- **각 언어별로 별도 문서 폴더 사용**

## 4. 작업 상태

### 완료된 작업 ✅
1. 기본 영어 사이트 생성 및 문서 이전 (80+ 문서)
2. Mintlify → Docusaurus sidebars 변환
3. Caret 브랜딩 적용 (Caretive INC 풋터)
4. 새로운 깔끔한 URL 구조 사이트 생성 (`caret-docs-multilang`)
5. 메인 랜딩 페이지 (언어 선택 카드) 구현
6. 영어 문서 사이트 구성 및 동작 확인
7. **Mintlify → Docusaurus 컴포넌트 변환 스크립트 완성**
   - Frame → figure, Tip → :::tip, Note → :::note 등
   - 38개 MDX 컴파일 오류 모두 해결
   - 재사용 가능한 자동화 스크립트 (`caret-scripts/docs/mintlify-to-docusaurus-converter.sh`)

### 사이트 동작 확인 ✅
- 메인 페이지: `http://localhost:3002/` (언어 선택)
- 영어 문서: `http://localhost:3002/en/` (완전 동작)
- 모든 MDX 컴파일 오류 해결됨
- 네비게이션 및 브랜딩 정상 작동

### 예정 작업 📋
1. 번역 완료 후 언어별 문서 연결
2. 최종 테스트 및 배포

## 5. 기술적 결정 사항
- **복잡한 i18n 설정 불사용** - 언어별 독립 사이트로 단순화
- **URL 기반 언어 선택** - 복잡한 언어 스위처 대신 직접 링크
- **MDX 뷰어 중심** - Docusaurus를 문서 렌더링 도구로만 활용

---

**핵심**: 복잡한 i18n 없이 URL 기반으로 언어별 독립 사이트 구성