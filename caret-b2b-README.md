# Caret B2B 시스템

> Caret의 B2B (Business-to-Business) 브랜드 변환 및 관리 시스템

## 🎯 개요

Caret B2B는 동일한 코드베이스에서 여러 브랜드 버전을 관리할 수 있는 시스템입니다. 현재 **Caret** (개발자용)과 **CodeCenter** (기업용) 두 브랜드를 지원합니다.

## 📁 시스템 구조

```
caret-b2b/
├── 📋 worklog/                    # 워크로그 및 개발 기록
│   ├── README.md                  # 워크로그 구조 설명
│   ├── (활성 워크로그들)           # 현재 진행 중인 문서들
│   └── _archive/                  # 완료된 작업들 아카이브
│       ├── completed/             # 완료된 작업
│       ├── deprecated/            # 더 이상 사용하지 않는 계획서
│       └── phase-reports/         # 페이즈별 보고서
│
├── 🛠️ tools/                      # 브랜드 변환 도구들
│   ├── README.md                  # 도구 사용법 가이드
│   ├── brand-converter.js         # 메인 브랜드 변환 도구
│   ├── brand-config-validator.js  # 설정 검증 도구
│   ├── convert-backend.js         # 백엔드 변환 로직
│   ├── convert-frontend.js        # 프론트엔드 변환 로직
│   ├── converter-utils.js         # 공통 유틸리티
│   └── _archive/                  # 구 버전 도구들
│
├── 🎨 brands/                     # 브랜드별 설정 및 리소스
│   ├── README.md                  # 브랜드 구조 설명
│   ├── caret/                     # Caret 브랜드 (원본)
│   ├── codecenter/                # CodeCenter 브랜드 (B2B)
│   └── cline/                     # Cline 브랜드 (레퍼런스)
│
├── 📚 docs/                       # 시스템 문서
│   ├── README.md                  # 문서 구조 설명
│   ├── branding-manual.md         # 브랜딩 가이드
│   └── frontend-conversion-process.md
│
└── 🧪 __tests__/                  # 테스트 파일들
```

## 🔄 브랜드 변환 시스템

### 지원 브랜드
- **Caret**: 개발자 중심 AI 코딩 어시스턴트
- **CodeCenter**: 기업용 코딩 솔루션

### 핵심 기능
- **T12**: providers.caret 백업/복구 시스템
- **T13**: 텍스트 후처리 및 매핑
- **T14**: 에셋 폴더 교체
- **T15**: FeatureConfig 기반 기능 제어

## 🚀 빠른 시작

### 브랜드 변환
```bash
# CodeCenter로 변환
node tools/brand-converter.js codecenter

# Caret으로 되돌리기
node tools/brand-converter.js caret
```

### 설정 검증
```bash
node tools/brand-config-validator.js
```

## 📋 주요 차이점

| 기능 | Caret | CodeCenter |
|------|-------|------------|
| 페르소나 설정 | ✅ 활성화 | ❌ 비활성화 |
| 비용 정보 표시 | ✅ 표시 | ❌ 숨김 |
| 기본 제공업체 | providers.caret | litellm |
| 모드 시스템 | caret | codecenter |
| 설정 후 리다이렉트 | persona | home |

## 🛡️ 안전성 보장

### 백업 시스템
- 변환 전 자동 백업 생성
- providers.caret 키 보존
- 데이터 무결성 유지

### 검증 시스템
- 설정 파일 유효성 검사
- 누락 필드 자동 감지
- 오류 발생 시 롤백 지원

## 📖 상세 문서

각 디렉토리의 README.md 파일에서 상세한 정보를 확인할 수 있습니다:

- [워크로그 구조](./worklog/README.md)
- [도구 사용법](./tools/README.md)
- [브랜드 설정](./brands/README.md)
- [시스템 문서](./docs/README.md)

## 🔧 개발 환경

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn
- VS Code (개발 및 테스트용)

### 개발 워크플로우
1. 기능 개발 (Caret 브랜드에서)
2. 테스트 및 검증
3. 브랜드 변환으로 호환성 확인
4. 배포

## 📞 지원

- **이슈 신고**: GitHub Issues
- **문서**: 각 디렉토리의 README.md
- **개발 기록**: worklog/ 디렉토리

---

**마지막 업데이트**: 2025-10-02
**버전**: 1.1.0 (CodeCenter), 0.2.3 (Caret)