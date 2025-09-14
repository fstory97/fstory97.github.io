# T11: 브랜드 변환 시스템 작업 체크리스트

## 📋 작업 목표
프론트엔드 브랜드 변환 도구 통합 및 시스템 정리

## ✅ Phase 1: 분석 및 준비
- [x] 현재 도구들 소스 코드 분석
  - [x] brand-converter-frontend.js 분석
  - [x] locale-brand-converter.js 분석
  - [x] frontend-brand-converter.js 분석
  - [x] codecenter-locale-replacer.js 분석
- [x] 문제점 파악
  - [x] locale 변환이 실제 프로젝트에 미적용
  - [x] 복원 시스템 부재
  - [x] 도구 중복
- [x] 통합 계획 수립
- [x] t11 문서 작성
  - [x] 개요 문서 (t11-brand-conversion-system-overview.md)
  - [x] 작업 체크리스트 (현재 문서)

## ✅ Phase 2: 통합 도구 개발

### 2.1 기능 통합
- [ ] 새로운 `frontend-brand-converter.js` 작성
  ```javascript
  class UnifiedFrontendConverter {
      // 핵심 메서드
      - convertBrand(from, to)
      - backupCurrent(brand)
      - applyBrand(brand)
      - restore(brand)
      - checkStatus()
  }
  ```

### 2.2 기능 구현
- [ ] **백업/복원 시스템**
  - [ ] locale 백업 (webview-ui/src/caret/locale → brands/{brand}/locale-backup)
  - [ ] assets 백업 (assets → brands/{brand}/assets-backup)
  - [ ] 메타데이터 저장 (timestamp, from/to brand, stats)
  - [ ] 복원 기능 (--restore 옵션)

- [ ] **브랜드 적용**
  - [ ] locale 적용 (brands/{brand}/locale → webview-ui/src/caret/locale)
  - [ ] assets 적용 (brands/{brand}/assets → assets)
  - [ ] 실제 프로젝트 경로에 적용 확인

- [ ] **다국어 매핑**
  - [ ] 영어 매핑 (Caret ↔ CodeCenter)
  - [ ] 한국어 매핑 (캐럿 ↔ 코드센터)
  - [ ] 한국어 조사 처리 (캐럿이→코드센터가, 캐럿을→코드센터를)
  - [ ] 일본어 매핑 (キャレット ↔ コードセンター)
  - [ ] 중국어 매핑 (克拉 ↔ 代码中心)
  - [ ] 회사명 변경 (Caretive INC ↔ Slexn INC)

- [ ] **옵션 구현**
  - [ ] --status (현재 브랜드 상태 확인)
  - [ ] --dry-run (시뮬레이션 모드)
  - [ ] --verbose (상세 로그)
  - [ ] --locale-only (locale만 변환)
  - [ ] --assets-only (assets만 변환)
  - [ ] --restore (백업에서 복원)
  - [ ] --list-backups (백업 목록)

- [ ] **유틸리티 기능**
  - [ ] JSON 유효성 검증
  - [ ] 통계 수집 (파일 수, 치환 횟수)
  - [ ] 로그 파일 생성
  - [ ] 에러 핸들링

### 2.3 브랜드별 설정
- [ ] caret 브랜드 설정 확인
- [ ] codecenter 브랜드 설정 확인
- [ ] cline 브랜드 설정 확인

## ✅ Phase 3: 기존 도구 정리

### 3.1 파일 삭제
- [ ] `caret-scripts/tools/locale-brand-converter.js` 삭제
- [ ] `caret-scripts/tools/codecenter-locale-replacer.js` 삭제
- [ ] `caret-scripts/tools/frontend-brand-converter.js` 삭제
- [ ] `caret-b2b/tools/brand-converter-frontend.js` 이동/수정

### 3.2 설정 파일 정리
- [ ] 불필요한 매핑 파일 정리
- [ ] brand-config.json 파일 검증

## ✅ Phase 4: 문서화

### 4.1 README.md 업데이트
- [ ] caret-b2b/README.md 수정
  - [ ] 명확한 명령어 설명
  - [ ] forward/backward 방향 정정
  - [ ] 통합 도구 사용법 추가
  - [ ] 예제 추가

### 4.2 명령어 정리
```markdown
## 백엔드 변환
node brand-converter.js caret forward      # cline → caret
node brand-converter.js codecenter forward # caret → codecenter
node brand-converter.js codecenter backward # codecenter → caret

## 프론트엔드 변환
node frontend-brand-converter.js caret codecenter  # 변환
node frontend-brand-converter.js --restore caret   # 복원
node frontend-brand-converter.js --status          # 상태 확인
```

## ✅ Phase 5: 테스트

### 5.1 기능 테스트
- [ ] Caret → CodeCenter 변환 테스트
  - [ ] locale 파일 변환 확인
  - [ ] assets 파일 교체 확인
  - [ ] 실제 프로젝트 적용 확인
- [ ] CodeCenter → Caret 복원 테스트
  - [ ] 백업에서 복원 확인
  - [ ] 원본 상태 복구 확인
- [ ] 옵션 테스트
  - [ ] --dry-run 동작 확인
  - [ ] --locale-only 동작 확인
  - [ ] --assets-only 동작 확인

### 5.2 에러 케이스 테스트
- [ ] 백업 없이 복원 시도
- [ ] 잘못된 브랜드명 입력
- [ ] 중복 실행 시 동작
- [ ] JSON 파일 손상 시 처리

## ✅ Phase 6: 검증 및 배포

### 6.1 최종 검증
- [ ] 모든 브랜드 변환 경로 테스트
  - [ ] cline → caret → codecenter
  - [ ] codecenter → caret → cline
- [ ] 빌드 테스트
  - [ ] npm run compile
  - [ ] npm run build:webview

### 6.2 완료 확인
- [ ] 모든 체크리스트 항목 완료
- [ ] 문서 최종 검토
- [ ] 팀 리뷰 및 피드백 반영

## 📝 주의사항

### ⚠️ 중요 확인 사항
1. **locale 변환이 실제 프로젝트에 적용되는지 확인**
   - `webview-ui/src/caret/locale/` 경로 확인
   - 변환 후 실제 파일 변경 확인

2. **백업 시스템 동작 확인**
   - 백업 폴더 생성 위치
   - 복원 시 정확한 복구

3. **중국어 JSON 에러 수정**
   - 이스케이프 문자 문제 해결
   - JSON 유효성 검증

## 🎯 최종 목표
- **통합된 단일 프론트엔드 변환 도구**
- **명확하고 일관된 변환 프로세스**
- **안전한 백업/복원 시스템**
- **정확한 문서화**

---

**작업 시작**: 2025-01-14
**목표 완료**: 2025-01-14
**담당**: Luke Yang + Claude Code