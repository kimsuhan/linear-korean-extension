# 리니어 한글화

Linear.app 화면 문구를 한국어로 바꾸는 MV3 확장. 빌드 과정이 없고, 저장소 폴더를 그대로 압축해제된 확장으로 로드한다. 구조는 [README.md](README.md), 배포 절차는 [RELEASING.md](RELEASING.md)를 본다.

## 번역 사전 (`locales/ko.json`)

- 키는 텍스트 노드나 속성(`placeholder`, `aria-label`, `title`, `alt`, `data-label`) 값 전체와 일치해야 한다. 앞뒤 공백과 연속 공백만 정규화하고, 부분 문자열은 번역하지 않는다.
- 문장 중간에 `<b>`나 링크가 끼면 텍스트 노드가 나뉘므로 조각마다 키를 따로 넣는다.
- 날짜, 상대 시간(`3 days ago`), 개수(`5 members`), 사이클 안내 같은 가변 문구는 `js/content.js`의 `patternTranslate`가 처리한다. 숫자가 들어간 문구는 사전에 넣지 말고 패턴을 고친다.
- 에디터, 코드 블록, 이슈 링크 안의 사용자 제목은 번역하지 않는다. 제외 범위는 `content.js`의 `SKIP`과 `process`에 있다.
- 용어는 기존 번역을 따른다(Issues 이슈, Inbox 받은 편지함, Views 뷰 등). 새 용어는 `ko.json`에서 같은 단어의 기존 번역을 먼저 검색한다.
- 제품, 연동 이름(GitHub, Slack, Linear Code 등)은 번역하지 않는다.
- 수정 후 `jq empty locales/ko.json`으로 JSON이 깨지지 않았는지 확인한다.

## 화면 확인

- 브라우저 자동화로는 `Extensions.loadUnpacked`를 쓸 수 없다. 대신 로그인된 Linear 페이지에서 `content.js`를 `chrome.runtime.sendMessage` 대체 함수와 함께 실행한다. `content.js`가 `globalThis.__linearKorean`으로 중복 실행을 막으므로 사전을 바꿨으면 새로고침 후 다시 넣는다.

  ```js
  (function (chrome) { /* js/content.js 내용 */ })({
    runtime: { sendMessage: async () => ({ locale: 'ko', messages: /* locales/ko.json 내용 */ }) },
  });
  ```

- 스크린샷은 회사 워크스페이스가 아닌 Acme 데모 워크스페이스에서 찍는다. 이메일 같은 개인정보가 보이지 않는지 확인한다.

## 배포

- `manifest.json`의 `version`을 먼저 올리고 같은 버전으로 `vX.Y.Z` 태그를 푸시한다. 버전이 다르면 워크플로가 첫 단계에서 실패한다.
- 웹스토어 심사가 진행 중이면 태그를 푸시하지 않는다.
- 확장에 포함하지 않을 파일을 저장소에 추가하면 `.gitattributes`에 `export-ignore`를 붙인다. 웹스토어 zip은 `git archive`로 만든다.

## 제약

- `permissions`를 추가하지 않고 외부 서버와 통신하지 않는다. 스토어 개인정보 신고(데이터 수집 없음, 원격 코드 없음)와 맞춰야 하며, 바꾸면 대시보드의 개인정보 보호 탭도 고쳐야 한다.
- LinearCN(GPL-3.0) 파생물이므로 `LICENSE`와 `NOTICE`를 유지한다.
