# 리니어 한글화

[Linear.app](https://linear.app)의 메뉴, 버튼, 설정 화면 같은 인터페이스 문구를 한국어로 바꿔 보여 주는 비공식 Chrome 확장 프로그램입니다.

[Chrome 웹 스토어에서 설치](https://chromewebstore.google.com/detail/ihlhiehmdnabfedbhlkheihpnmeejnef)

## 기능

- 사이드바, 이슈 목록, 설정 화면 등 Linear 인터페이스 문구를 한국어로 표시합니다.
- 설치만 하면 바로 적용되며 별도 설정이 필요 없습니다. 이미 열려 있던 Linear 탭은 새로고침하면 적용됩니다.
- 사용자가 작성한 이슈 제목, 본문, 댓글은 번역하지 않습니다.

## 개인정보

- 번역 사전은 확장 프로그램 안에 포함되어 있고, 모든 번역은 브라우저 안에서만 처리됩니다.
- 워크스페이스 내용을 수집하거나 외부로 전송하지 않으며, 외부 서버와 통신하지 않습니다.
- 권한은 요청하지 않고, `*.linear.app` 페이지에만 콘텐츠 스크립트를 삽입합니다.

## 개발

빌드 과정은 없습니다. `chrome://extensions`에서 개발자 모드를 켜고 압축해제된 확장 프로그램을 로드에서 이 폴더를 선택하면 됩니다.

- `js/content.js`: 페이지의 문구를 찾아 바꾸는 번역 엔진
- `js/background.js`: 콘텐츠 스크립트에 번역 사전을 전달
- `locales/ko.json`: 영어 문구와 한국어 번역 사전
- `options/`: 확장 아이콘을 눌렀을 때 뜨는 팝업

번역이 빠졌거나 어색한 문구는 `locales/ko.json`에 추가하거나 고치면 됩니다. 배포 방법은 [RELEASING.md](RELEASING.md)를 참고하세요.

## 라이선스

[LinearCN](https://chromewebstore.google.com/detail/LinearCN/iadjepkibljfmgjomobigajcegclfedc)(GPL-3.0)의 번역 엔진과 사전을 기반으로 하며, [GPL-3.0](LICENSE)으로 배포됩니다. 자세한 내용은 [NOTICE](NOTICE)를 참고하세요.

이 확장 프로그램은 Linear Orbit, Inc.와 관련이 없습니다.
