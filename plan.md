# Virtual DOM & Diff Algorithm Implementation Prompt
> Claude Code에 아래 내용을 복사하여 붙여넣기 하세요.
---
## 프로젝트 개요
React의 핵심 개념인 **Virtual DOM**과 **Diff 알고리즘**을 Vanilla JS로 직접 구현하고, 이를 시각적으로 검증할 수 있는 인터랙티브 웹 페이지를 만들어줘.
포트폴리오에 넣을 수 있을 정도로 완성도 높게, 코드 품질과 UI 모두 신경 써줘.
---
## 기술 스택
- **HTML / CSS / JavaScript (Vanilla)** — 프레임워크 없이 순수 구현
- `index.html`, 'css', 'js' 파일로 구성 (외부 의존성 없음)
---
## 프로젝트 구조
```
virtual-dom-diff/
├── index.html          # 메인 애플리케이션 (HTML + CSS + JS 올인원)
├── README.md           # 프로젝트 설명 문서
└── assets/             # (선택) 스크린샷 등
```
---
## 1. Virtual DOM 핵심 구현
### 1-1. VNode 구조체
```js
// Virtual DOM 노드 구조
{
  type: 'element' | 'text',
  tagName: string,       // 'div', 'span', 'ul' 등
  props: {               // 속성 객체
    id: string,
    className: string,
    style: string,
    onClick: function,
// ...기타 속성
  },
  children: VNode[],     // 자식 VNode 배열
  text: string,          // type이 'text'일 때 텍스트 내용
  key: string | null,    // diff 최적화용 key
}
```
### 1-2. 구현할 함수들
| 함수명 | 설명 |
|--------|------|
| `createElement(tagName, props, ...children)` | VNode 생성 헬퍼 |
| `domToVNode(realDOMElement)` | 실제 DOM → Virtual DOM 변환 |
| `vnodeToDOM(vnode)` | Virtual DOM → 실제 DOM 변환 |
| `diff(oldVNode, newVNode)` | 두 VNode 트리 비교 → patches 배열 반환 |
| `patch(realDOM, patches)` | patches를 실제 DOM에 최소 단위로 적용 |
### 1-3. Diff 알고리즘 — 5가지 핵심 케이스
반드시 아래 5가지 케이스를 모두 처리해야 함:
1. **REPLACE** — 노드 타입이나 tagName이 다를 때 → 노드 전체 교체
2. **PROPS** — 같은 노드인데 속성(class, style, id 등)이 변경됨 → 속성만 업데이트
3. **TEXT** — 텍스트 노드의 내용이 변경됨 → textContent만 업데이트
4. **REORDER (INSERT/REMOVE)** — 자식 노드 추가/삭제 → 최소한의 DOM 조작
5. **CHILDREN** — 자식 노드 재귀 비교 → 재귀적으로 diff 수행
각 케이스가 발생할 때 콘솔과 UI 로그 패널에 어떤 패치가 적용되는지 표시해줘.
### 1-4. Patch 적용 시 주의사항
- `document.createElement`, `setAttribute`, `removeAttribute`, `replaceChild`, `appendChild`, `removeChild`, `insertBefore` 등 네이티브 DOM API만 사용
- innerHTML 사용 금지 (patch 함수에서)
- Reflow/Repaint 최소화를 위해 `DocumentFragment` 또는 배치 업데이트 활용
---
## 2. 웹 페이지 UI 구현
### 2-1. 레이아웃
```
┌──────────────────────────────────────────────────────┐
│                    헤더 / 타이틀                       │
├────────────────────┬─────────────────────────────────┤
│                    │                                 │
│   실제 영역         │      테스트 영역                  │
│   (Real DOM)       │      (Editable Area)            │
│                    │                                 │
│   - Diff 적용 결과  │   - contenteditable 또는         │
│     렌더링됨        │     textarea로 HTML 직접 편집     │
│                    │                                 │
├────────────────────┴─────────────────────────────────┤
│         [ ◀ 뒤로가기 ]  [ Patch ]  [ 앞으로가기 ▶ ]     │
├──────────────────────────────────────────────────────┤
│                                                      │
│   Diff 로그 패널 (어떤 변경이 감지되었는지 시각화)        │
│   - REPLACE: <div> → <section>                       │
│   - PROPS: class "old" → "new"                       │
│   - TEXT: "Hello" → "World"                          │
│   - INSERT: <li> added at index 3                    │
│   - REMOVE: <li> removed at index 1                  │
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│   Virtual DOM 트리 시각화 (트리 구조로 VNode 표시)       │
│   - Old VTree / New VTree 나란히 비교                  │
│   - 변경된 노드 하이라이트                               │
│                                                      │
├──────────────────────────────────────────────────────┤
│   State History: [0] [1] [2] [3] ← 현재              │
└──────────────────────────────────────────────────────┘
```
### 2-2. 기능 상세
#### 페이지 로드 시
1. "실제 영역"에 아래 샘플 HTML이 렌더링되어 있음
2. 이 실제 DOM을 `domToVNode()`로 Virtual DOM 변환
3. 변환된 VNode를 `vnodeToDOM()`으로 "테스트 영역"에도 렌더링
4. 초기 VNode를 State History[0]에 저장
#### 샘플 HTML (실제 영역 초기 콘텐츠)
```html
<div class="container">
  <h1 id="title" style="color: #333;">Virtual DOM Demo</h1>
  <p class="description">This is a sample paragraph.</p>
  <ul class="item-list">
    <li class="item" data-key="1">Item 1</li>
    <li class="item active" data-key="2">Item 2</li>
    <li class="item" data-key="3">Item 3</li>
  </ul>
  <div class="card">
    <h2>Card Title</h2>
    <p>Card content goes here.</p>
    <button class="btn primary">Click Me</button>
  </div>
  <footer>
    <span class="copyright">© 2025</span>
  </footer>
</div>
```
#### 테스트 영역
- **HTML 소스 코드를 직접 편집**할 수 있는 textarea 또는 코드 에디터 영역
- 편집된 HTML의 **실시간 미리보기**도 함께 표시
- 문법 하이라이팅은 없어도 되지만, 가독성 좋은 monospace 폰트 사용
#### Patch 버튼 클릭 시
1. 테스트 영역의 현재 HTML을 파싱하여 새 VNode 생성
2. 이전 VNode(State History의 현재 위치)와 diff 수행
3. 변경된 patches를 "실제 영역"에 적용
4. Diff 로그 패널에 적용된 패치 목록 표시 (타입, 대상, 변경 내용)
5. Virtual DOM 트리 시각화 업데이트 (변경된 노드 하이라이트)
6. 새 VNode를 State History에 push
#### 뒤로가기 / 앞으로가기
- State History 배열에서 인덱스를 이동
- 해당 VNode로 "실제 영역"과 "테스트 영역" 모두 업데이트
- 현재 위치 표시 (예: `3 / 5`)
---
## 3. UI/UX 디자인 요구사항
- **다크 모드** 기본 (모던한 느낌)
- 깔끔한 sans-serif 폰트 (시스템 폰트 스택 사용)
- 코드 영역은 monospace
- 변경된 노드에 **애니메이션** 효과 (flash, highlight 등)
- 반응형 레이아웃 (모바일에서도 사용 가능)
- Diff 로그에 **색상 코딩**:
- 🟢 INSERT — green
- 🔴 REMOVE — red
- 🟡 REPLACE — yellow/orange
- 🔵 PROPS — blue
- 🟣 TEXT — purple
- Virtual DOM 트리는 **접기/펼치기** 가능
- State History는 클릭 가능한 타임라인 바 형태
---
## 4. README.md 작성
아래 구조로 상세하고 예쁜 README.md를 작성해줘:
```markdown
# 🌳 Virtual DOM & Diff Algorithm
> React의 핵심을 밑바닥부터 구현합니다.
## 📋 목차
- 프로젝트 소개
- 데모
- 실행 방법
- 아키텍처
- 핵심 개념
- 왜 Virtual DOM인가? (Reflow/Repaint 문제)
- Virtual DOM 구조
- Diff 알고리즘 5가지 케이스
- Patch 적용 과정
- 구현 상세
- domToVNode()
- diff()
- patch()
- State History (Undo/Redo)
- React와의 비교
- 엣지 케이스 처리
- 기술적 의사결정
```
README에 포함할 핵심 내용:
### 왜 실제 DOM이 느린가?
- DOM 변경 → Style 계산 → Layout(Reflow) → Paint → Composite
- 하나의 속성 변경이 전체 레이아웃 재계산을 유발할 수 있음
- 여러 DOM 변경을 개별 수행하면 매번 Reflow 발생
- Virtual DOM은 메모리에서 변경사항을 모아 최소 DOM 조작으로 배치 적용
### Diff 알고리즘 동작 방식
- O(n) 시간 복잡도 (트리의 같은 레벨끼리만 비교)
- 5가지 케이스 각각 다이어그램과 코드 예시 포함
- key를 활용한 리스트 최적화 설명
### React에서의 실제 동작
- Fiber 아키텍처와의 관계
- Reconciliation 과정
- batched updates
- 이 프로젝트에서 구현한 것 vs React 실제 구현의 차이점
---
## 5. 엣지 케이스 체크리스트
아래 케이스들을 모두 테스트하고 정상 동작해야 함:
- [ ] 빈 태그 (`<div></div>`)
- [ ] 자기 닫힘 태그 (`<br>`, `<img>`, `<hr>`, `<input>`)
- [ ] 텍스트만 있는 노드
- [ ] 깊게 중첩된 구조 (5단계 이상)
- [ ] 리스트 아이템 순서 변경
- [ ] 리스트 아이템 중간 삽입/삭제
- [ ] 속성만 변경 (class, style, data-* 등)
- [ ] 노드 타입 변경 (`<div>` → `<section>`)
- [ ] 전체 자식 교체
- [ ] 빈 상태에서 자식 추가
- [ ] 모든 자식 제거
- [ ] 인라인 스타일 변경
- [ ] 여러 속성 동시 변경
- [ ] 같은 내용으로 Patch (변경 없음 감지)
- [ ] 잘못된 HTML 입력 시 에러 핸들링
- [ ] State History 처음/끝에서 뒤로가기/앞으로가기 비활성화
---
## 6. 코드 품질 요구사항
- **주석**: 모든 핵심 함수에 JSDoc 스타일 한글 주석
- **네이밍**: 의미 있는 변수/함수명
- **모듈화**: 논리적 단위로 코드 분리 (같은 파일 내에서 섹션으로)
- **에러 처리**: try-catch로 HTML 파싱 에러 등 처리
- **성능**: 불필요한 DOM 조작 최소화
- **가독성**: 들여쓰기, 일관된 코드 스타일
---
## 실행 방법
```bash
# 별도 설치 없이 브라우저에서 바로 실행
open index.html
# 또는
python -m http.server 8080
# → http://localhost:8080
```
---
## 최종 체크리스트
구현 완료 후 아래를 모두 확인해줘:
1. ✅ `index.html` 단일 파일로 동작
2. ✅ Virtual DOM 구조체 정의 및 생성
3. ✅ `domToVNode()` — 실제 DOM → VNode 변환
4. ✅ `vnodeToDOM()` — VNode → 실제 DOM 변환
5. ✅ `diff()` — 5가지 케이스 모두 처리
6. ✅ `patch()` — 최소 DOM 조작으로 변경 적용
7. ✅ 실제 영역 / 테스트 영역 분리
8. ✅ Patch 버튼으로 diff → patch 적용
9. ✅ Diff 로그 패널 (색상 코딩)
10. ✅ Virtual DOM 트리 시각화
11. ✅ State History (뒤로가기/앞으로가기)
12. ✅ 다크 모드 UI
13. ✅ 변경 노드 애니메이션
14. ✅ 엣지 케이스 처리
15. ✅ README.md 상세 작성
16. ✅ 한글 주석