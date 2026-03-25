const SAMPLE_HTML = {
  initial: `
<section class="lab-card" data-stage="initial">
  <h2>미니 리액트 실험실</h2>
  <p>
    이 영역은 <strong>실제 DOM</strong> 입니다.
    <span class="lab-highlight">Patch</span>를 누르면 필요한 부분만 바뀝니다.
  </p>
  <div class="lab-row">
    <span class="lab-badge">실제 DOM</span>
    <span class="lab-badge">Virtual DOM</span>
    <span class="lab-badge">Diff</span>
  </div>
  <ul>
    <li>텍스트 변경 감지</li>
    <li>속성 변경 감지</li>
    <li>노드 추가 / 삭제</li>
  </ul>
  <div class="lab-note">브라우저의 실제 DOM 조작은 비싸기 때문에 최소 변경이 중요합니다.</div>
</section>
  `.trim(),
  text: `
<section class="lab-card" data-stage="text-change">
  <h2>미니 리액트 실험실</h2>
  <p>
    이 영역은 <strong>실제 DOM</strong> 입니다.
    <span class="lab-highlight">Patch</span>를 누르면
    <strong>텍스트가 달라진 부분만</strong> 바뀝니다.
  </p>
  <div class="lab-row">
    <span class="lab-badge">실제 DOM</span>
    <span class="lab-badge">Virtual DOM</span>
    <span class="lab-badge">Diff</span>
  </div>
  <ul>
    <li>텍스트 변경 감지</li>
    <li>속성 변경 감지</li>
    <li>노드 추가 / 삭제</li>
  </ul>
  <div class="lab-note">텍스트 노드 하나만 바뀌어도 Diff는 그 위치를 정확히 찾습니다.</div>
</section>
  `.trim(),
  props: `
<section class="lab-card-alt" data-stage="props-change" data-theme="warm">
  <h2>미니 리액트 실험실</h2>
  <p>
    이 영역은 <strong>실제 DOM</strong> 입니다.
    <span class="lab-highlight">속성 변경</span>이 일어나면 class, data-* 속성을 다시 맞춥니다.
  </p>
  <div class="lab-row">
    <span class="lab-badge">실제 DOM</span>
    <span class="lab-badge">Virtual DOM</span>
    <span class="lab-badge">Props</span>
  </div>
  <ul>
    <li>class 변경</li>
    <li>data-* 속성 변경</li>
    <li>시각 스타일 반영</li>
  </ul>
  <div class="lab-note">태그는 그대로 두고 속성만 바뀌면 PROPS Patch만 실행됩니다.</div>
</section>
  `.trim(),
  add: `
<section class="lab-card" data-stage="add-node">
  <h2>미니 리액트 실험실</h2>
  <p>
    새 노드가 생기면 이전 Virtual DOM에는 없던 위치에 <strong>CREATE Patch</strong>가 기록됩니다.
  </p>
  <div class="lab-row">
    <span class="lab-badge">실제 DOM</span>
    <span class="lab-badge">Virtual DOM</span>
    <span class="lab-badge">Diff</span>
    <span class="lab-badge">Patch</span>
  </div>
  <ul>
    <li>텍스트 변경 감지</li>
    <li>속성 변경 감지</li>
    <li>노드 추가 / 삭제</li>
    <li>새로운 리스트 아이템 추가</li>
  </ul>
  <div class="lab-stack">
    <article class="lab-note">새 자식 노드가 추가되면 실제 DOM에도 같은 위치에 삽입됩니다.</article>
    <article class="lab-note">리스트가 길어질수록 최소 변경 전략의 가치가 더 커집니다.</article>
  </div>
</section>
  `.trim(),
  remove: `
<section class="lab-card" data-stage="remove-node">
  <h2>미니 리액트 실험실</h2>
  <p>
    노드가 사라지면 실제 DOM에서도 해당 위치를 찾아 <strong>REMOVE Patch</strong>를 적용합니다.
  </p>
  <div class="lab-row">
    <span class="lab-badge">실제 DOM</span>
    <span class="lab-badge">Virtual DOM</span>
  </div>
  <ul>
    <li>텍스트 변경 감지</li>
  </ul>
</section>
  `.trim(),
  replace: `
<article class="lab-card-alt" data-stage="replace-node">
  <h2>태그 교체 시나리오</h2>
  <p>
    루트 태그가 <strong>section</strong>에서 <strong>article</strong>로 바뀌면, Diff는
    같은 노드로 볼 수 없어 <span class="lab-warning">REPLACE Patch</span>를 실행합니다.
  </p>
  <ol>
    <li>태그 이름 비교</li>
    <li>다르면 기존 노드 교체</li>
    <li>이후 자식 구조는 새 DOM으로 대체</li>
  </ol>
  <div class="lab-note">이 경우에는 부분 수정이 아니라 해당 노드를 통째로 교체하는 편이 안전합니다.</div>
</article>
  `.trim(),
};

const BENCHMARK_CASES = {
  "single-text": {
    title: "케이스 1. 큰 리스트 + 텍스트 1개 변경",
    summary:
      "요소 수는 많지만 실제 변경은 텍스트 1개뿐인 경우입니다. Patch 전략이 유리한 대표 상황입니다.",
    expectation: "부분 변경만 있을 때는 Diff 후 Patch가 유리할 가능성이 큽니다.",
    buildScenario: () => ({
      oldVdom: buildBenchmarkTree(500),
      newVdom: buildBenchmarkTree(500, {
        textChanges: {
          320: "320번 카드의 설명만 새 문장으로 교체했습니다. 나머지 구조는 그대로 유지됩니다.",
        },
      }),
    }),
  },
  "single-props": {
    title: "케이스 2. 큰 리스트 + class 1개 변경",
    summary:
      "구조는 그대로 두고 카드 하나의 class와 data 속성만 바꾸는 경우입니다. PROPS Patch 중심으로 처리됩니다.",
    expectation: "속성만 바뀌는 경우는 실제 DOM 전체 교체보다 Patch가 효율적일 수 있습니다.",
    buildScenario: () => ({
      oldVdom: buildBenchmarkTree(500),
      newVdom: buildBenchmarkTree(500, {
        classChanges: {
          180: "benchmark-item benchmark-item-hot",
        },
        dataToneChanges: {
          180: "hot",
        },
      }),
    }),
  },
  "append-item": {
    title: "케이스 3. 큰 리스트 + 항목 1개 추가",
    summary:
      "긴 리스트 끝에 새 카드 하나만 추가하는 상황입니다. 전체 재렌더링보다 CREATE Patch의 가치가 드러날 수 있습니다.",
    expectation: "마지막에 항목 1개만 붙는 상황은 Patch가 유리하게 나올 가능성이 있습니다.",
    buildScenario: () => ({
      oldVdom: buildBenchmarkTree(700),
      newVdom: buildBenchmarkTree(701),
    }),
  },
  "many-changes": {
    title: "케이스 4. 중간 리스트 + 대량 변경",
    summary:
      "카드 수는 조금 줄이고, 많은 항목의 텍스트와 class를 한꺼번에 바꾸는 상황입니다. 여기서는 전체 교체가 비슷하거나 더 빠를 수도 있습니다.",
    expectation:
      "변경 범위가 넓으면 Diff 계산 비용이 커져서 전체 교체가 비슷하거나 더 빠를 수도 있습니다.",
    buildScenario: () => ({
      oldVdom: buildBenchmarkTree(220),
      newVdom: buildBenchmarkTree(220, {
        massUpdateEvery: 2,
      }),
    }),
  },
};

const state = {
  history: [],
  historyIndex: -1,
  actualVdom: null,
  testVdom: null,
  lastPatches: [],
  mutationContext: "초기 렌더링",
  inputTimerId: null,
  benchmarkHistory: [],
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  setupMutationObserver();
  initializeDemo();
  runScenarioFromUrl();
});

function cacheElements() {
  elements.actualRoot = document.getElementById("actual-dom-root");
  elements.testRoot = document.getElementById("test-dom-root");
  elements.htmlEditor = document.getElementById("html-editor");
  elements.patchButton = document.getElementById("patch-btn");
  elements.backButton = document.getElementById("back-btn");
  elements.forwardButton = document.getElementById("forward-btn");
  elements.resetButton = document.getElementById("reset-btn");
  elements.historyStatus = document.getElementById("history-status");
  elements.patchStatus = document.getElementById("patch-status");
  elements.actualVdomView = document.getElementById("actual-vdom-view");
  elements.testVdomView = document.getElementById("test-vdom-view");
  elements.patchList = document.getElementById("patch-list");
  elements.logView = document.getElementById("log-view");
  elements.sampleButtons = Array.from(document.querySelectorAll("[data-sample]"));
  elements.benchmarkButtons = Array.from(document.querySelectorAll("[data-benchmark]"));
  elements.benchmarkAllButton = document.getElementById("benchmark-all-btn");
  elements.benchmarkStatus = document.getElementById("benchmark-status");
  elements.benchmarkSummary = document.getElementById("benchmark-summary");
  elements.benchmarkResults = document.getElementById("benchmark-results");
  elements.benchmarkHistory = document.getElementById("benchmark-history");
  elements.benchmarkRoot = document.getElementById("benchmark-root");
}

function bindEvents() {
  elements.patchButton.addEventListener("click", handlePatch);
  elements.backButton.addEventListener("click", () => moveHistory(-1));
  elements.forwardButton.addEventListener("click", () => moveHistory(1));
  elements.resetButton.addEventListener("click", resetDemo);

  elements.htmlEditor.addEventListener("input", () => {
    window.clearTimeout(state.inputTimerId);
    state.inputTimerId = window.setTimeout(() => {
      syncTestPreviewFromEditor("사용자 입력");
    }, 120);
  });

  elements.sampleButtons.forEach((button) => {
    button.addEventListener("click", () => loadSample(button.dataset.sample));
  });

  elements.benchmarkButtons.forEach((button) => {
    button.addEventListener("click", () => runBenchmark(button.dataset.benchmark));
  });

  elements.benchmarkAllButton.addEventListener("click", runAllBenchmarks);
}

function initializeDemo() {
  state.mutationContext = "초기 렌더링";
  elements.logView.innerHTML = "";

  renderHtmlIntoContainer(elements.actualRoot, SAMPLE_HTML.initial);
  state.actualVdom = containerToVdom(elements.actualRoot);

  renderVdomIntoContainer(elements.testRoot, cloneVdom(state.actualVdom));
  state.testVdom = containerToVdom(elements.testRoot);
  elements.htmlEditor.value = vdomToPrettyHtml(state.testVdom);

  state.history = [];
  state.historyIndex = -1;
  state.lastPatches = [];
  state.benchmarkHistory = [];
  pushHistory(cloneVdom(state.actualVdom), "초기 상태");

  logAction(
    "초기화 완료",
    "실제 영역 DOM을 Virtual DOM으로 변환했고, 같은 구조를 테스트 영역에 렌더링했습니다."
  );
  updateAllViews("초기 상태가 준비되었습니다.");
  resetBenchmarkViews();
}

function resetDemo() {
  initializeDemo();
  logAction("재설정", "초기 샘플 HTML로 되돌렸습니다.");
}

function runScenarioFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const sample = params.get("sample");
  const autorun = params.get("autorun");
  const historyDirection = params.get("history");

  if (sample && SAMPLE_HTML[sample]) {
    loadSample(sample);
  }

  if (autorun === "patch") {
    handlePatch();
  }

  if (historyDirection === "back") {
    moveHistory(-1);
  }

  if (historyDirection === "forward") {
    moveHistory(1);
  }
}

function loadSample(sampleKey) {
  const sampleHtml = SAMPLE_HTML[sampleKey] || SAMPLE_HTML.initial;
  elements.htmlEditor.value = sampleHtml;
  syncTestPreviewFromEditor(`샘플 로드: ${sampleLabel(sampleKey)}`);
}

function sampleLabel(sampleKey) {
  const labels = {
    initial: "기본 샘플",
    text: "텍스트 변경",
    props: "속성 변경",
    add: "노드 추가",
    remove: "노드 삭제",
    replace: "태그 교체",
  };
  return labels[sampleKey] || "샘플";
}

function syncTestDomFromEditor() {
  renderHtmlIntoContainer(elements.testRoot, elements.htmlEditor.value);
  state.testVdom = containerToVdom(elements.testRoot);
  return state.testVdom;
}

function syncTestPreviewFromEditor(reason) {
  syncTestDomFromEditor();
  updateAllViews("테스트 영역 미리보기가 갱신되었습니다.");
  logAction(reason, "HTML 편집기 내용을 기반으로 테스트 영역 DOM을 다시 렌더링했습니다.");
}

function handlePatch() {
  window.clearTimeout(state.inputTimerId);

  const nextVdom = syncTestDomFromEditor();
  const patches = diffTrees(state.actualVdom, nextVdom);

  if (patches.length === 0) {
    state.lastPatches = [];
    updateAllViews("변경 사항이 없어 Patch를 수행하지 않았습니다.");
    logAction("Patch 생략", "이전 Virtual DOM과 새 Virtual DOM이 동일해서 변경할 내용이 없습니다.");
    return;
  }

  state.mutationContext = "Patch 적용";
  applyPatches(elements.actualRoot, patches);

  state.actualVdom = cloneVdom(nextVdom);
  state.testVdom = cloneVdom(nextVdom);
  state.lastPatches = patches;

  pushHistory(cloneVdom(nextVdom), summarizePatches(patches));
  updateAllViews(`${patches.length}개의 Patch가 실제 DOM에 반영되었습니다.`);
  logPatchResult(patches);
}

function moveHistory(direction) {
  const nextIndex = state.historyIndex + direction;
  if (nextIndex < 0 || nextIndex >= state.history.length) {
    return;
  }

  const snapshot = state.history[nextIndex];
  state.historyIndex = nextIndex;
  state.mutationContext = direction < 0 ? "히스토리 뒤로가기" : "히스토리 앞으로가기";

  renderVdomIntoContainer(elements.actualRoot, cloneVdom(snapshot.vdom));
  renderVdomIntoContainer(elements.testRoot, cloneVdom(snapshot.vdom));
  state.actualVdom = cloneVdom(snapshot.vdom);
  state.testVdom = cloneVdom(snapshot.vdom);
  state.lastPatches = [];
  elements.htmlEditor.value = vdomToPrettyHtml(snapshot.vdom);

  updateAllViews(`히스토리 ${nextIndex + 1}번째 상태로 이동했습니다.`);
  logAction(
    direction < 0 ? "뒤로가기" : "앞으로가기",
    `${snapshot.label} 상태로 이동했고, 실제 영역과 테스트 영역을 함께 동기화했습니다.`
  );
}

function pushHistory(vdom, summary) {
  if (state.historyIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIndex + 1);
  }

  const nextOrder = state.history.length === 0 ? "초기 상태" : `Patch ${state.history.length}`;
  state.history.push({
    label: nextOrder,
    summary,
    vdom,
    savedAt: new Date().toLocaleTimeString("ko-KR"),
  });
  state.historyIndex = state.history.length - 1;
}

function updateAllViews(statusText) {
  elements.actualVdomView.textContent = JSON.stringify(state.actualVdom, null, 2);
  elements.testVdomView.textContent = JSON.stringify(state.testVdom, null, 2);
  renderPatchList();
  elements.historyStatus.textContent = `히스토리 ${state.historyIndex + 1} / ${state.history.length}`;
  elements.patchStatus.textContent = statusText;
  elements.backButton.disabled = state.historyIndex <= 0;
  elements.forwardButton.disabled = state.historyIndex >= state.history.length - 1;
}

function resetBenchmarkViews() {
  elements.benchmarkStatus.textContent = "성능 테스트 대기 중";
  elements.benchmarkSummary.textContent =
    "작은 DOM에서는 차이가 거의 안 날 수 있고, 큰 DOM에서 일부만 바뀌면 Patch 전략이 유리할 수 있습니다.";
  elements.benchmarkResults.innerHTML = "";
  renderBenchmarkHistory();
}

function renderBenchmarkHistory() {
  elements.benchmarkHistory.innerHTML = "";

  if (state.benchmarkHistory.length === 0) {
    const item = document.createElement("li");
    item.className = "patch-empty";
    item.textContent = "아직 실행한 성능 테스트가 없습니다.";
    elements.benchmarkHistory.appendChild(item);
    return;
  }

  state.benchmarkHistory.forEach((result) => {
    const item = document.createElement("li");
    item.textContent = `${result.title}: 전체 교체 ${formatMs(result.fullReplace.average)}ms / Patch ${formatMs(
      result.patch.average
    )}ms / 판단: ${result.winnerText}`;
    elements.benchmarkHistory.appendChild(item);
  });
}

function buildBenchmarkTree(count, options = {}) {
  const textChanges = options.textChanges || {};
  const classChanges = options.classChanges || {};
  const dataToneChanges = options.dataToneChanges || {};
  const massUpdateEvery = options.massUpdateEvery || 0;
  const items = [];

  for (let index = 0; index < count; index += 1) {
    const isMassUpdated = massUpdateEvery > 0 && index % massUpdateEvery === 0;
    const itemClass = classChanges[index] || (isMassUpdated ? "benchmark-item benchmark-item-hot" : "benchmark-item");
    const dataTone = dataToneChanges[index] || (isMassUpdated ? "hot" : "base");
    const title = isMassUpdated ? `업데이트된 카드 ${index + 1}` : `기준 카드 ${index + 1}`;
    const description =
      textChanges[index] ||
      (isMassUpdated
        ? `이 카드는 대량 변경 실험에서 내용이 바뀐 항목입니다. index=${index}`
        : `이 카드는 Virtual DOM 성능 실험을 위한 기준 항목입니다. index=${index}`);
    const badge = isMassUpdated ? "대량 변경" : "기준 상태";

    items.push({
      type: "ELEMENT",
      tag: "li",
      props: {
        class: itemClass,
        "data-index": String(index),
        "data-tone": dataTone,
      },
      children: [
        {
          type: "ELEMENT",
          tag: "h3",
          props: {},
          children: [{ type: "TEXT", value: title }],
        },
        {
          type: "ELEMENT",
          tag: "p",
          props: {},
          children: [{ type: "TEXT", value: description }],
        },
        {
          type: "ELEMENT",
          tag: "span",
          props: { class: "benchmark-badge" },
          children: [{ type: "TEXT", value: badge }],
        },
      ],
    });
  }

  return {
    type: "ROOT",
    children: [
      {
        type: "ELEMENT",
        tag: "section",
        props: { class: "benchmark-board" },
        children: [
          {
            type: "ELEMENT",
            tag: "header",
            props: { class: "benchmark-header" },
            children: [
              {
                type: "ELEMENT",
                tag: "h2",
                props: {},
                children: [{ type: "TEXT", value: `성능 실험 카드 ${count}개` }],
              },
              {
                type: "ELEMENT",
                tag: "p",
                props: {},
                children: [{ type: "TEXT", value: "숨겨진 DOM 루트에서 전체 교체와 Patch를 비교합니다." }],
              },
            ],
          },
          {
            type: "ELEMENT",
            tag: "ul",
            props: { class: "benchmark-list" },
            children: items,
          },
        ],
      },
    ],
  };
}

function measureBenchmarkCase(oldVdom, newVdom, iterations = 12) {
  const fullReplaceTimes = [];
  const patchTimes = [];
  let latestPatchCount = 0;

  for (let index = 0; index < iterations; index += 1) {
    renderVdomIntoContainer(elements.benchmarkRoot, cloneVdom(oldVdom));
    const fullStart = performance.now();
    renderVdomIntoContainer(elements.benchmarkRoot, cloneVdom(newVdom));
    fullReplaceTimes.push(performance.now() - fullStart);

    renderVdomIntoContainer(elements.benchmarkRoot, cloneVdom(oldVdom));
    const patchStart = performance.now();
    const patches = diffTrees(oldVdom, newVdom);
    latestPatchCount = patches.length;
    applyPatches(elements.benchmarkRoot, patches);
    patchTimes.push(performance.now() - patchStart);
  }

  return {
    fullReplace: summarizeTiming(fullReplaceTimes),
    patch: summarizeTiming(patchTimes),
    patchCount: latestPatchCount,
    iterations,
  };
}

function summarizeTiming(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    average: total / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function runBenchmark(caseKey) {
  const config = BENCHMARK_CASES[caseKey];
  if (!config) {
    return;
  }

  const scenario = config.buildScenario();
  const measurement = measureBenchmarkCase(scenario.oldVdom, scenario.newVdom);
  const fullAverage = measurement.fullReplace.average;
  const patchAverage = measurement.patch.average;
  const diff = patchAverage - fullAverage;
  const winner =
    patchAverage < fullAverage
      ? "patch"
      : fullAverage < patchAverage
        ? "full"
        : "tie";
  const winnerText =
    winner === "patch"
      ? "Patch가 더 빨랐습니다."
      : winner === "full"
        ? "전체 교체가 더 빨랐습니다."
        : "두 방식이 거의 비슷했습니다.";

  const result = {
    key: caseKey,
    title: config.title,
    summary: config.summary,
    expectation: config.expectation,
    winnerText,
    diff,
    ...measurement,
  };

  state.benchmarkHistory = [result, ...state.benchmarkHistory.filter((item) => item.key !== caseKey)];
  renderBenchmarkResult(result);
  renderBenchmarkHistory();
  elements.benchmarkStatus.textContent = `${config.title} 실행 완료`;

  logAction(
    `${config.title} 성능 비교 완료`,
    `전체 교체 평균 ${formatMs(fullAverage)}ms, Patch 평균 ${formatMs(
      patchAverage
    )}ms, Patch 개수 ${measurement.patchCount}개. ${winnerText}`
  );

  if (console.table) {
    console.table([
      {
        케이스: config.title,
        "전체 교체 평균(ms)": Number(fullAverage.toFixed(3)),
        "Patch 평균(ms)": Number(patchAverage.toFixed(3)),
        "Patch 개수": measurement.patchCount,
        판단: winnerText,
      },
    ]);
  }
}

function runAllBenchmarks() {
  Object.keys(BENCHMARK_CASES).forEach((caseKey) => {
    runBenchmark(caseKey);
  });
  elements.benchmarkStatus.textContent = "4개 성능 테스트 실행 완료";
}

function renderBenchmarkResult(result) {
  elements.benchmarkSummary.textContent = `${result.summary} 예측: ${result.expectation}`;
  elements.benchmarkResults.innerHTML = "";

  const card = document.createElement("div");
  card.className = "benchmark-card";

  const heading = document.createElement("h4");
  heading.textContent = result.title;

  const summary = document.createElement("p");
  summary.textContent = `${result.summary} 총 ${result.iterations}회 반복 평균입니다.`;

  const metrics = document.createElement("div");
  metrics.className = "benchmark-metrics";

  metrics.appendChild(
    createBenchmarkMetric(
      "전체 교체 평균",
      `${formatMs(result.fullReplace.average)}ms`,
      `최소 ${formatMs(result.fullReplace.min)} / 최대 ${formatMs(result.fullReplace.max)}`
    )
  );
  metrics.appendChild(
    createBenchmarkMetric(
      "Patch 평균",
      `${formatMs(result.patch.average)}ms`,
      `최소 ${formatMs(result.patch.min)} / 최대 ${formatMs(result.patch.max)}`
    )
  );
  metrics.appendChild(
    createBenchmarkMetric("Patch 개수", `${result.patchCount}개`, "Diff가 만든 작업 수")
  );
  metrics.appendChild(
    createBenchmarkMetric(
      "평균 차이",
      `${formatMs(Math.abs(result.diff))}ms`,
      result.diff < 0 ? "Patch가 더 빠름" : result.diff > 0 ? "전체 교체가 더 빠름" : "거의 동일"
    )
  );

  const note = document.createElement("p");
  note.className = "benchmark-note";
  note.textContent = `해석: ${result.winnerText}`;

  card.appendChild(heading);
  card.appendChild(summary);
  card.appendChild(metrics);
  card.appendChild(note);
  elements.benchmarkResults.appendChild(card);
}

function createBenchmarkMetric(title, value, detail) {
  const wrapper = document.createElement("div");
  wrapper.className = "benchmark-metric";

  const strong = document.createElement("strong");
  strong.textContent = title;

  const valueNode = document.createElement("div");
  valueNode.textContent = value;

  const detailNode = document.createElement("p");
  detailNode.textContent = detail;

  wrapper.appendChild(strong);
  wrapper.appendChild(valueNode);
  wrapper.appendChild(detailNode);
  return wrapper;
}

function renderPatchList() {
  const patches = state.lastPatches;
  elements.patchList.innerHTML = "";

  if (patches.length === 0) {
    const item = document.createElement("li");
    item.className = "patch-empty";
    item.textContent =
      "최근 Patch가 없거나, 현재 상태는 히스토리 이동으로 복원된 상태입니다.";
    elements.patchList.appendChild(item);
    return;
  }

  patches.forEach((patch) => {
    const item = document.createElement("li");
    item.textContent = describePatch(patch);
    elements.patchList.appendChild(item);
  });
}

function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    if (mutations.length === 0) {
      return;
    }

    const summary = mutations
      .map((mutation, index) => describeMutation(mutation, index + 1))
      .join(" | ");

    logAction(`MutationObserver 감지 (${state.mutationContext})`, summary);
  });

  observer.observe(document.getElementById("actual-dom-root"), {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
  });
}

function describeMutation(mutation, order) {
  if (mutation.type === "childList") {
    const added = mutation.addedNodes.length;
    const removed = mutation.removedNodes.length;
    return `${order}. childList 변화 - 추가 ${added}개, 삭제 ${removed}개`;
  }

  if (mutation.type === "attributes") {
    return `${order}. 속성 변화 - ${mutation.attributeName} 변경`;
  }

  if (mutation.type === "characterData") {
    return `${order}. 텍스트 변화 - "${trimText(mutation.target.nodeValue)}"`;
  }

  return `${order}. 기타 DOM 변화`;
}

function renderHtmlIntoContainer(container, html) {
  container.innerHTML = "";
  const fragment = createSanitizedFragment(html);
  container.appendChild(fragment);
}

function createSanitizedFragment(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();

  template.content.querySelectorAll("script").forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      if (attribute.name.toLowerCase().startsWith("on")) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return template.content.cloneNode(true);
}

function isComparableDomNode(node) {
  if (!node) {
    return false;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue.trim() !== "";
  }

  return node.nodeType === Node.ELEMENT_NODE;
}

function getComparableChildNodes(node) {
  return Array.from(node.childNodes).filter(isComparableDomNode);
}

function containerToVdom(container) {
  const children = getComparableChildNodes(container)
    .map(domNodeToVdom)
    .filter(Boolean);

  return {
    type: "ROOT",
    children,
  };
}

function domNodeToVdom(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.nodeValue.trim() === "") {
      return null;
    }

    return {
      type: "TEXT",
      value: node.nodeValue,
    };
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const props = {};
  Array.from(node.attributes).forEach((attribute) => {
    props[attribute.name] = attribute.value;
  });

  const children = getComparableChildNodes(node)
    .map(domNodeToVdom)
    .filter(Boolean);

  return {
    type: "ELEMENT",
    tag: node.tagName.toLowerCase(),
    props,
    children,
  };
}

function renderVdomIntoContainer(container, rootVdom) {
  container.innerHTML = "";
  rootVdom.children.forEach((child) => {
    container.appendChild(vdomToDom(child));
  });
}

function vdomToDom(vnode) {
  if (vnode.type === "TEXT") {
    return document.createTextNode(vnode.value);
  }

  const element = document.createElement(vnode.tag);

  Object.entries(vnode.props || {}).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  (vnode.children || []).forEach((child) => {
    element.appendChild(vdomToDom(child));
  });

  return element;
}

function diffTrees(oldTree, newTree) {
  const patches = [];
  diffNode(oldTree, newTree, [], patches);
  return patches;
}

function diffNode(oldNode, newNode, path, patches) {
  if (!oldNode && newNode) {
    patches.push({ type: "CREATE", path, node: cloneVdom(newNode) });
    return;
  }

  if (oldNode && !newNode) {
    patches.push({ type: "REMOVE", path });
    return;
  }

  if (!oldNode || !newNode) {
    return;
  }

  if (oldNode.type === "ROOT" && newNode.type === "ROOT") {
    const maxLength = Math.max(oldNode.children.length, newNode.children.length);
    for (let index = 0; index < maxLength; index += 1) {
      diffNode(oldNode.children[index], newNode.children[index], [...path, index], patches);
    }
    return;
  }

  if (oldNode.type !== newNode.type) {
    patches.push({ type: "REPLACE", path, node: cloneVdom(newNode) });
    return;
  }

  if (oldNode.type === "TEXT" && newNode.type === "TEXT") {
    if (oldNode.value !== newNode.value) {
      patches.push({
        type: "TEXT",
        path,
        value: newNode.value,
        previousValue: oldNode.value,
      });
    }
    return;
  }

  if (oldNode.tag !== newNode.tag) {
    patches.push({ type: "REPLACE", path, node: cloneVdom(newNode) });
    return;
  }

  const propChanges = diffProps(oldNode.props, newNode.props);
  if (propChanges.set.length > 0 || propChanges.remove.length > 0) {
    patches.push({
      type: "PROPS",
      path,
      set: propChanges.set,
      remove: propChanges.remove,
    });
  }

  const maxLength = Math.max(oldNode.children.length, newNode.children.length);
  for (let index = 0; index < maxLength; index += 1) {
    diffNode(oldNode.children[index], newNode.children[index], [...path, index], patches);
  }
}

function diffProps(oldProps = {}, newProps = {}) {
  const set = [];
  const remove = [];

  Object.keys(newProps).forEach((key) => {
    if (oldProps[key] !== newProps[key]) {
      set.push({ key, value: newProps[key] });
    }
  });

  Object.keys(oldProps).forEach((key) => {
    if (!(key in newProps)) {
      remove.push(key);
    }
  });

  return { set, remove };
}

function applyPatches(container, patches) {
  const removePatches = patches
    .filter((patch) => patch.type === "REMOVE")
    .sort((a, b) => comparePathsDesc(a.path, b.path));

  const otherPatches = patches.filter((patch) => patch.type !== "REMOVE");

  removePatches.forEach((patch) => applySinglePatch(container, patch));
  otherPatches.forEach((patch) => applySinglePatch(container, patch));
}

function applySinglePatch(container, patch) {
  switch (patch.type) {
    case "CREATE":
      insertNodeAtPath(container, patch.path, vdomToDom(patch.node));
      break;
    case "REMOVE":
      removeNodeAtPath(container, patch.path);
      break;
    case "REPLACE":
      replaceNodeAtPath(container, patch.path, vdomToDom(patch.node));
      break;
    case "TEXT":
      updateTextAtPath(container, patch.path, patch.value);
      break;
    case "PROPS":
      updatePropsAtPath(container, patch.path, patch);
      break;
    default:
      break;
  }
}

function insertNodeAtPath(container, path, node) {
  const parent = getNodeByPath(container, path.slice(0, -1));
  const index = path[path.length - 1];
  const reference = parent ? getComparableChildNodes(parent)[index] || null : null;

  if (parent) {
    parent.insertBefore(node, reference);
  }
}

function removeNodeAtPath(container, path) {
  const target = getNodeByPath(container, path);
  if (target && target.parentNode) {
    target.parentNode.removeChild(target);
  }
}

function replaceNodeAtPath(container, path, node) {
  const target = getNodeByPath(container, path);
  if (target && target.parentNode) {
    target.parentNode.replaceChild(node, target);
  }
}

function updateTextAtPath(container, path, value) {
  const target = getNodeByPath(container, path);
  if (target) {
    target.nodeValue = value;
  }
}

function updatePropsAtPath(container, path, patch) {
  const target = getNodeByPath(container, path);
  if (!target || target.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  patch.remove.forEach((key) => {
    target.removeAttribute(key);
  });

  patch.set.forEach(({ key, value }) => {
    target.setAttribute(key, value);
  });
}

function getNodeByPath(container, path) {
  let current = container;

  for (const index of path) {
    const comparableChildren = current ? getComparableChildNodes(current) : null;

    if (!current || !comparableChildren || !comparableChildren[index]) {
      return null;
    }
    current = comparableChildren[index];
  }

  return current;
}

function comparePathsDesc(pathA, pathB) {
  for (let index = 0; index < Math.max(pathA.length, pathB.length); index += 1) {
    const valueA = pathA[index] ?? -1;
    const valueB = pathB[index] ?? -1;
    if (valueA !== valueB) {
      return valueB - valueA;
    }
  }
  return pathB.length - pathA.length;
}

function describePatch(patch) {
  const location = `경로 ${formatPath(patch.path)}`;

  if (patch.type === "CREATE") {
    return `노드 추가: ${location} 위치에 ${describeVNode(patch.node)} 를 삽입합니다.`;
  }

  if (patch.type === "REMOVE") {
    return `노드 삭제: ${location} 위치의 기존 DOM 노드를 제거합니다.`;
  }

  if (patch.type === "REPLACE") {
    return `태그 교체: ${location} 위치를 ${describeVNode(patch.node)} 로 통째로 교체합니다.`;
  }

  if (patch.type === "TEXT") {
    return `텍스트 변경: ${location} 위치의 텍스트를 "${trimText(
      patch.previousValue
    )}" 에서 "${trimText(patch.value)}" 로 바꿉니다.`;
  }

  if (patch.type === "PROPS") {
    const setText = patch.set.map(({ key, value }) => `${key}="${value}"`).join(", ");
    const removeText = patch.remove.join(", ");
    const parts = [];

    if (setText) {
      parts.push(`설정: ${setText}`);
    }

    if (removeText) {
      parts.push(`제거: ${removeText}`);
    }

    return `속성 변경: ${location} 위치에서 ${parts.join(" / ")} 를 반영합니다.`;
  }

  return `${patch.type}: ${location}`;
}

function describeVNode(vnode) {
  if (!vnode) {
    return "빈 노드";
  }

  if (vnode.type === "TEXT") {
    return `텍스트("${trimText(vnode.value)}")`;
  }

  return `<${vnode.tag}>`;
}

function formatPath(path) {
  if (path.length === 0) {
    return "ROOT";
  }

  return path.join(" > ");
}

function summarizePatches(patches) {
  const counts = patches.reduce((accumulator, patch) => {
    accumulator[patch.type] = (accumulator[patch.type] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .map(([type, count]) => `${type} ${count}개`)
    .join(", ");
}

function logPatchResult(patches) {
  const title = `Patch 적용 완료 (${summarizePatches(patches)})`;
  logAction(title, patches.map(describePatch).join(" | "));

  if (console.table) {
    console.table(
      patches.map((patch) => ({
        유형: patch.type,
        경로: formatPath(patch.path),
        설명: describePatch(patch),
      }))
    );
  }
}

function logAction(title, message) {
  const timestamp = new Date().toLocaleTimeString("ko-KR");
  const prefix = `[미니 리액트 데모 ${timestamp}] ${title}`;

  console.groupCollapsed(prefix);
  console.log(message);
  console.groupEnd();

  const entry = document.createElement("div");
  entry.className = "log-entry";

  const strong = document.createElement("strong");
  strong.textContent = `${timestamp} - ${title}`;

  const detail = document.createElement("p");
  detail.textContent = message;

  entry.appendChild(strong);
  entry.appendChild(detail);
  elements.logView.prepend(entry);
}

function vdomToPrettyHtml(rootVdom) {
  return rootVdom.children.map((child) => vnodeToHtmlString(child, 0)).join("\n");
}

function vnodeToHtmlString(vnode, depth) {
  const indent = "  ".repeat(depth);

  if (vnode.type === "TEXT") {
    return `${indent}${escapeHtml(vnode.value.trim())}`;
  }

  const attributes = Object.entries(vnode.props || {})
    .map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`)
    .join("");

  if (!vnode.children || vnode.children.length === 0) {
    return `${indent}<${vnode.tag}${attributes}></${vnode.tag}>`;
  }

  if (vnode.children.length === 1 && vnode.children[0].type === "TEXT") {
    return `${indent}<${vnode.tag}${attributes}>${escapeHtml(
      vnode.children[0].value.trim()
    )}</${vnode.tag}>`;
  }

  const childContent = vnode.children
    .map((child) => vnodeToHtmlString(child, depth + 1))
    .join("\n");

  return `${indent}<${vnode.tag}${attributes}>\n${childContent}\n${indent}</${vnode.tag}>`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;");
}

function trimText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function cloneVdom(vdom) {
  return JSON.parse(JSON.stringify(vdom));
}

function formatMs(value) {
  return value.toFixed(3);
}
