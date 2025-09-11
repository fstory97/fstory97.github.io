# 튜토리얼 소개

**Docusaurus를 5분 안에 배워보세요.**

## 시작하기

**새로운 사이트**를 생성하거나 **기존 사이트**에 **Docusaurus**를 추가해보세요.

### 필요한 것

- [Node.js](https://nodejs.org/en/download/) 버전 18.0 이상:
  - Node.js를 설치할 때 모든 체크박스에 체크하세요.

## 새로운 사이트 생성

클래식 템플릿을 사용하여 새로운 Docusaurus 사이트를 생성하세요.

클래식 템플릿은 Docusaurus **CLI**의 일부로 자동으로 설치됩니다.

```bash
npm init docusaurus@latest my-website classic
```

사이트를 실행할 수 있습니다:

```bash
cd my-website
npm run start
```

`start` 명령어는 로컬 개발 서버를 구동하고 브라우저 창을 엽니다. 대부분의 변경 사항은 서버를 재시작하지 않고도 즉시 반영됩니다.

## 사이트 설정

`docusaurus.config.js`를 편집하고 사이트 세부 정보를 변경하세요.

## Markdown 페이지 추가

**Markdown 또는 React** 파일을 `src/pages`에 추가하여 **독립 실행형 페이지**를 만드세요:

- `src/pages/index.js` → `localhost:3000/`
- `src/pages/foo.md` → `localhost:3000/foo`
- `src/pages/foo/bar.js` → `localhost:3000/foo/bar`

## 첫 번째 문서 만들기

`docs/hello.md`에 Markdown 파일을 만드세요:

```md title="docs/hello.md"
# 안녕하세요

이것은 제 **첫 번째 Docusaurus 문서**입니다!
```

새로운 문서가 `http://localhost:3000/docs/hello`에서 사용할 수 있습니다.

## 사이드바 설정

Docusaurus는 **`docs` 폴더**에서 자동으로 **사이드바**를 만듭니다.

메타데이터를 추가하여 사이드바 라벨과 위치를 사용자 정의하세요:

```md title="docs/hello.md" {1-4}
---
sidebar_label: 'Hi!'
sidebar_position: 3
---

# 안녕하세요

이것은 제 **첫 번째 Docusaurus 문서**입니다!
```

`sidebars.js`에서 사이드바를 명시적으로 생성할 수도 있습니다:

```js title="sidebars.js"
module.exports = {
  tutorialSidebar: [
    'intro',
    'hello',
    {
      type: 'category',
      label: '튜토리얼',
      items: ['tutorial-basics/create-a-document'],
    },
  ],
};
```