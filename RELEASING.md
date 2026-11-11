# 릴리즈

`v*` 태그를 푸시하면 `.github/workflows/release.yml`이 zip을 만들어 Chrome Web Store에 업로드하고 검토를 제출한 뒤, GitHub Release에 첨부한다. 검토를 통과하면 자동으로 게시된다.

## 새 버전 내기

1. `manifest.json`의 `version`을 올린다. 태그와 다르면 워크플로가 실패한다.
2. 커밋하고 태그를 푸시한다.

```bash
git tag v1.0.1 && git push origin main v1.0.1
```

zip 내용은 `git archive`가 정하고, 제외할 파일은 `.gitattributes`의 `export-ignore`로 관리한다. 로컬에서 같은 zip을 만들려면 다음을 실행한다.

```bash
git archive --format=zip -o dist/linear-korean.zip HEAD
```

## 처음 한 번 설정

1. [Google Cloud 콘솔](https://console.cloud.google.com)에서 프로젝트를 만들고 Chrome Web Store API를 사용 설정한다.
2. [서비스 계정](https://console.cloud.google.com/iam-admin/serviceaccounts)을 만든다. 역할은 추가하지 않아도 된다.
3. 서비스 계정의 키 탭에서 JSON 키를 만들어 내려받는다.
4. 개발자 대시보드의 계정 섹션에 서비스 계정 이메일을 추가한다. 게시자당 하나만 추가할 수 있다.
5. JSON 키를 GitHub Secret으로 등록하고, 로컬 키 파일은 지운다.

```bash
gh secret set CWS_SERVICE_ACCOUNT_KEY --repo kimsuhan/linear-korean-extension < 키파일.json
```

게시자 ID와 항목 ID는 공개 정보라 워크플로의 `env`에 적어 두었다.

참고: [Chrome Web Store API](https://developer.chrome.com/docs/webstore/using-api), [서비스 계정 사용](https://developer.chrome.com/docs/webstore/service-accounts)
