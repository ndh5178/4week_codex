# Virtual DOM / Diff / Patch 데모

React의 핵심 아이디어인 Virtual DOM, Diff 알고리즘, Patch 반영 과정을 브라우저에서 직접 확인할 수 있는 순수 `HTML + CSS + JavaScript` 데모입니다.

## 파일 구성

- `index.html`: 데모 화면과 한글 설명 UI
- `style.css`: 레이아웃과 시각 스타일
- `app.js`: Virtual DOM 변환, Diff, Patch, History, 콘솔 로그 로직
- `README.md`: 발표용 개념 정리와 사용 방법

실행에 필요한 최소 파일은 `index.html`, `style.css`, `app.js` 3개입니다. 지금 저장소에는 발표와 협업을 위해 `README.md`까지 포함한 4개 파일로 구성했습니다.

## 실행 방법

1. 저장소 루트에서 `index.html`을 브라우저로 열면 바로 실행됩니다.
2. 개발자 도구 콘솔을 열어두면 Patch 과정과 MutationObserver 로그를 한글로 함께 볼 수 있습니다.

## 데모 흐름

1. 페이지 로드 시 실제 영역의 샘플 DOM을 읽어서 Virtual DOM으로 변환합니다.
2. 변환한 Virtual DOM을 바탕으로 테스트 영역을 렌더링합니다.
3. 사용자는 테스트 영역의 HTML 코드를 자유롭게 수정합니다.
4. `Patch 적용` 버튼을 누르면 현재 테스트 영역 DOM을 다시 Virtual DOM으로 변환합니다.
5. 이전 Virtual DOM과 새 Virtual DOM을 Diff 하여 변경점을 찾습니다.
6. 변경된 부분만 실제 영역 DOM에 Patch 합니다.
7. 새 상태를 히스토리에 저장하고, `뒤로가기 / 앞으로가기`로 이동할 수 있습니다.

## 포함된 핵심 개념

- 실제 DOM과 브라우저 렌더링 비용
- Reflow / Repaint
- Virtual DOM 구조
- DOM -> Virtual DOM 변환
- Diff 알고리즘 5대 케이스
- Patch 적용 방식
- MutationObserver를 이용한 실제 DOM 변화 감지
- State History
- React와의 연결 포인트
