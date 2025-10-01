# Caret B2B Tools

## 🛠️ 활성 도구들

### 브랜드 변환 시스템
- **`brand-converter.js`** - 메인 브랜드 변환 도구
  - Caret ↔ CodeCenter 자동 변환
  - T12-T15 백업/복구 시스템 포함
  - 사용법: `node tools/brand-converter.js [caret|codecenter]`

- **`brand-config-validator.js`** - 브랜드 설정 검증 도구
  - 브랜드 설정 파일 유효성 검사
  - 누락된 필드 및 오류 탐지

### 변환 모듈들
- **`convert-backend.js`** - 백엔드 파일 변환 로직
  - 텍스트 매핑 변환
  - 규칙 파일 경로 변환
  - feature-config.json 교체

- **`convert-frontend.js`** - 프론트엔드 파일 변환 로직
  - 프론트엔드 파일 백업 및 교체
  - 텍스트 후처리 적용
  - 에셋 폴더 교체

- **`converter-utils.js`** - 공통 유틸리티 함수들
  - 파일 I/O 헬퍼
  - 텍스트 변환 유틸리티
  - 백업/복구 함수들

## 📁 아카이브 (`_archive/`)
- `brand-converter.js.backup` - 백업된 구 버전
- `brand-converter.old.js` - 레거시 버전
- `fix-cost-exposure.js` - 일회성 수정 스크립트

## 🔧 사용 예시

### 브랜드 변환
```bash
# Caret으로 변환
node tools/brand-converter.js caret

# CodeCenter로 변환
node tools/brand-converter.js codecenter
```

### 설정 검증
```bash
# 브랜드 설정 검증
node tools/brand-config-validator.js
```

## 📋 시스템 아키텍처

### T12: providers.caret 백업/복구
- 브랜드 변환 전 providers.caret 키 백업
- 변환 후 백업된 키 복원
- 데이터 무결성 보장

### T13: 텍스트 후처리
- 브랜드별 특수 텍스트 변환 규칙 적용
- 중첩 매핑 충돌 해결

### T14: 에셋 폴더 교체
- 브랜드별 이미지 및 리소스 파일 교체
- 아이콘, 배너, 캐릭터 이미지 등

### T15: 기본 제공업체 설정
- FeatureConfig 기반 동적 제공업체 설정
- 하드코딩 방지 및 브랜드별 커스터마이징

---
*마지막 업데이트: 2025-10-02*