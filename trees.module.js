/**
 * ============================================================================
 * !!! TREES MODULE GUIDE / AGENT.md !!!
 * ============================================================================
 *
 * 이 파일은 Trees 시각화 패널을 "입력 데이터만 넘기면 렌더 가능한 독립 모듈"로 제공한다.
 * 핵심 목표는 두 가지다.
 * 1. 다른 HTML/JS 파일에서 oldVNode, newVNode, patches만 넘겨도 트리를 그릴 수 있게 한다.
 * 2. 입력 포맷이 프로젝트마다 달라도, Codex가 병합하면서 adapter만 추가해 붙일 수 있게 한다.
 *
 * ----------------------------------------------------------------------------
 * !!! 가장 중요한 통합 규칙 !!!
 * ----------------------------------------------------------------------------
 * [다른 HTML 파일에 붙이는 상세 순서]
 *
 * STEP 1. 트리가 들어갈 mount 영역을 HTML에 만든다.
 *
 *   <div id="trees-mount"></div>
 *
 * STEP 2. `</body>` 바로 위에서 이 파일을 로드한다.
 *
 *   <script src="./trees.module.js"></script>
 *
 * STEP 3. host 파일 안에서 현재 사용할 데이터 변수를 확인한다.
 * - 이미 `oldVNode`, `newVNode`, `patches`가 있으면 가장 쉽다.
 * - `patches`가 없고 `oldVNode`, `newVNode`만 있어도 된다.
 * - 변수명이 다르면 host 파일을 억지로 바꾸지 말고 adapter를 만든다.
 *
 * STEP 4-A. 표준 형식이면 바로 렌더한다.
 *
 *   <script>
 *     window.TreesModule.renderInto(
 *       document.getElementById('trees-mount'),
 *       {
 *         oldVNode,
 *         newVNode,
 *         patches
 *       }
 *     );
 *   </script>
 *
 * STEP 4-B. patches가 없으면 old/new만 넘긴다.
 *
 *   <script>
 *     window.TreesModule.renderInto(
 *       document.getElementById('trees-mount'),
 *       {
 *         oldVNode,
 *         newVNode
 *       }
 *     );
 *   </script>
 *
 * STEP 4-C. 형식이 다르면 adapter를 먼저 등록한 뒤 data를 넘긴다.
 *
 *   <script>
 *     window.TreesModule.registerAdapter('index-copy-format', (input) => ({
 *       oldVNode: input.prevTree,
 *       newVNode: input.nextTree,
 *       patches: input.patchList || null,
 *       meta: {
 *         title: 'Index Copy Trees'
 *       }
 *     }));
 *
 *     window.TreesModule.renderInto(
 *       document.getElementById('trees-mount'),
 *       {
 *         adapter: 'index-copy-format',
 *         data: {
 *           prevTree,
 *           nextTree,
 *           patchList
 *         }
 *       }
 *     );
 *   </script>
 *
 * STEP 5. mount 위치가 실제로 렌더 가능한 크기를 가지는지 확인한다.
 * - `#trees-mount`가 display:none 이거나 height가 0이면 패널이 정상적으로 안 보일 수 있다.
 * - 보통 panel/body/content 영역 안에 넣는 것이 가장 안전하다.
 *
 * STEP 6. 문제가 생기면 순서부터 점검한다.
 * - `#trees-mount`가 script보다 먼저 DOM에 있는가?
 * - `trees.module.js`가 먼저 로드됐는가?
 * - host 데이터가 실제로 존재하는가?
 * - VNode 형식이 다르면 adapter를 넣었는가?
 *
 * 1. 호스트 파일이 이미 `oldVNode`, `newVNode`, `patches`를 갖고 있으면:
 *
 *    window.TreesModule.renderInto(container, {
 *      oldVNode,
 *      newVNode,
 *      patches
 *    });
 *
 * 2. 호스트 파일이 `oldVNode`, `newVNode`만 갖고 있고 patches는 없으면:
 *
 *    window.TreesModule.renderInto(container, {
 *      oldVNode,
 *      newVNode
 *    });
 *
 *    위 경우 이 모듈이 내부 diff를 계산한다.
 *
 * 3. 호스트 파일의 데이터 형식이 다르면:
 *
 *    window.TreesModule.registerAdapter('my-format', (input) => ({
 *      oldVNode: input.prevTree,
 *      newVNode: input.nextTree,
 *      patches: input.precomputedPatches || null,
 *      meta: {
 *        title: 'Custom Trees'
 *      }
 *    }));
 *
 *    window.TreesModule.renderInto(container, {
 *      adapter: 'my-format',
 *      data: rawIncomingData
 *    });
 *
 * ----------------------------------------------------------------------------
 * Public API
 * ----------------------------------------------------------------------------
 * - `window.TreesModule.registerAdapter(name, adapterFn)`
 * - `window.TreesModule.normalizeInput(input)`
 * - `window.TreesModule.diffVNodes(oldVNode, newVNode)`
 * - `window.TreesModule.createModel(inputOrOptions)`
 * - `window.TreesModule.renderToString(inputOrOptions)`
 * - `window.TreesModule.renderInto(container, inputOrOptions)`
 * - `window.TreesModule.ensureStyles()`
 * - `window.TreesModule.registerToSidebar(options)`
 *
 * ----------------------------------------------------------------------------
 * Supported Input Contract
 * ----------------------------------------------------------------------------
 * 기본 입력 스키마:
 *
 * {
 *   oldVNode?: VNode | null,
 *   newVNode?: VNode | null,
 *   patches?: Patch[] | null,
 *   meta?: {
 *     title?: string,
 *     badge?: string,
 *     eyebrow?: string,
 *     summaryTitle?: string,
 *     summaryCopy?: string,
 *     inspectorFile?: string
 *   }
 * }
 *
 * 기본 VNode 형식:
 * - element node:
 *   {
 *     type: 'element',
 *     tagName: 'div',
 *     props: { id: 'root' },
 *     children: [ ... ],
 *     key: null
 *   }
 *
 * - text node:
 *   {
 *     type: 'text',
 *     text: 'hello',
 *     key: null
 *   }
 *
 * Patch 형식:
 * - `{ type, index, path, ... }`
 * - 이 모듈은 index/path/type만 있으면 하이라이트와 요약을 만들 수 있다.
 *
 * ----------------------------------------------------------------------------
 * File Handoff / 병합 가이드
 * ----------------------------------------------------------------------------
 * 다른 Codex가 이 파일을 다른 프로젝트에 붙일 때 우선순위는 다음과 같다.
 *
 * 1. 호스트 프로젝트에 VNode 형식이 이미 이 파일과 비슷하면:
 *    - adapter 없이 `oldVNode`, `newVNode`, `patches`를 직접 넘긴다.
 *
 * 2. VNode 형식이 다르면:
 *    - 기존 파일을 억지로 바꾸지 말고 `registerAdapter()`를 추가한다.
 *    - adapter는 "호스트 형식 -> TreesModule 표준 입력" 변환만 담당한다.
 *
 * 3. diff가 이미 프로젝트 내부에 있으면:
 *    - host가 계산한 patches를 그대로 넘긴다.
 *    - 이 모듈 내부 diff는 fallback으로만 둔다.
 *
 * 4. diff가 없으면:
 *    - oldVNode/newVNode만 넘겨도 된다.
 *    - 이 모듈의 `diffVNodes()`가 기본 계산을 수행한다.
 *
 * ----------------------------------------------------------------------------
 * Important Cautions
 * ----------------------------------------------------------------------------
 * - 이 파일은 Trees "시각화 패널"을 책임진다.
 * - Sidebar active 상태 변경과 화면 전환은 호스트 페이지 책임이다.
 * - 레이아웃은 독립 CSS를 주입하므로 Tailwind 없이도 동작한다.
 * - 복잡한 프로젝트에서는 host가 patches를 계산해 넘기는 쪽이 더 안전하다.
 * - adapter를 추가할 때는 host의 기존 VNode 구조를 직접 수정하기보다, 여기서 변환하는 쪽을 우선한다.
 * ============================================================================
 */
(() => {
  const TREES_STYLE_ID = 'trees-module-styles';
  const adapterRegistry = Object.create(null);

  // HTML에 텍스트를 안전하게 넣는 함수입니다.
  // 외부 파일에서 넘어온 경로/설명/속성값이 그대로 들어와도 마크업이 깨지지 않게 기본 이스케이프를 적용합니다.
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 배열/객체 기반 입력을 안전하게 복사하는 함수입니다.
  // 호스트가 넘긴 참조를 직접 변형하면 원본 상태 관리와 충돌할 수 있어, 내부 계산은 복사본 기준으로 진행합니다.
  function deepCopy(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  // text/element 여부를 판별하는 기본 VNode 정규화 함수입니다.
  // 프로젝트마다 필드 이름이 약간씩 달라도 최소한의 표준 형식으로 맞춰야 내부 diff와 트리 생성 로직을 재사용할 수 있습니다.
  function normalizeVNode(node) {
    if (!node) {
      return null;
    }

    if (node.type === 'text' || typeof node.text === 'string') {
      return {
        type: 'text',
        text: String(node.text ?? ''),
        key: node.key ?? null
      };
    }

    return {
      type: 'element',
      tagName: String(node.tagName || node.name || 'node').toLowerCase(),
      props: node.props || node.attributes || {},
      children: Array.isArray(node.children) ? node.children.map(normalizeVNode).filter(Boolean) : [],
      key: node.key ?? null
    };
  }

  // 외부 입력을 표준 TreesModule 입력 형식으로 바꾸는 함수입니다.
  // adapter, raw data, 직접 입력 세 방식을 모두 허용해야 다른 파일 병합 시 host 구조를 크게 뜯지 않아도 됩니다.
  function normalizeInput(input = {}) {
    if (input.adapter) {
      const adapter = typeof input.adapter === 'function' ? input.adapter : adapterRegistry[input.adapter];
      if (!adapter) {
        throw new Error(`TreesModule adapter not found: ${input.adapter}`);
      }

      return normalizeInput(adapter(input.data ?? input));
    }

    const normalized = {
      oldVNode: normalizeVNode(input.oldVNode || input.prevVNode || input.previousVNode || null),
      newVNode: normalizeVNode(input.newVNode || input.nextVNode || input.currentVNode || null),
      patches: Array.isArray(input.patches) ? deepCopy(input.patches) : null,
      meta: {
        title: input.meta?.title || input.title,
        badge: input.meta?.badge || input.badge,
        eyebrow: input.meta?.eyebrow || input.eyebrow,
        summaryTitle: input.meta?.summaryTitle || input.summaryTitle,
        summaryCopy: input.meta?.summaryCopy || input.summaryCopy,
        inspectorFile: input.meta?.inspectorFile || input.inspectorFile
      }
    };

    return normalized;
  }

  // 기본 adapter 등록 함수입니다.
  // 병합 시 host 파일 형식이 달라도 이 함수만 추가 호출하면 TreesModule 본문을 건드리지 않고 재사용할 수 있습니다.
  function registerAdapter(name, adapterFn) {
    adapterRegistry[name] = adapterFn;
  }

  // VNode가 가진 총 노드 수를 계산하는 함수입니다.
  // DFS index 기반 diff를 계산할 때 각 서브트리 크기를 알아야 REMOVE/INSERT 인덱스를 안정적으로 맞출 수 있습니다.
  function countNodes(vnode) {
    if (!vnode) {
      return 0;
    }

    if (vnode.type === 'text') {
      return 1;
    }

    return 1 + (vnode.children || []).reduce((sum, child) => sum + countNodes(child), 0);
  }

  // props 차이만 추출하는 함수입니다.
  // host가 patch를 안 주는 경우에도 최소한의 diff 품질을 유지해야 하므로, 기본 props 비교 로직을 모듈 내부에 둡니다.
  function diffProps(oldProps = {}, newProps = {}) {
    const result = {};
    const keys = new Set([...Object.keys(oldProps || {}), ...Object.keys(newProps || {})]);

    for (const key of keys) {
      if ((oldProps || {})[key] !== (newProps || {})[key]) {
        result[key] = {
          old: (oldProps || {})[key] ?? null,
          new: (newProps || {})[key] ?? null
        };
      }
    }

    return Object.keys(result).length ? result : null;
  }

  // 기본 VNode diff 함수입니다.
  // 프로젝트 내부 diff를 바로 재사용 못하는 상황에서도 old/new VNode만 있으면 Trees 하이라이트가 가능하게 하는 fallback 역할입니다.
  function diffVNodes(oldV, newV, patches, idx, path) {
    const nextPatches = patches || [];
    const nextIdx = idx || { value: 0 };
    const nextPath = path || 'root';
    const currentIndex = nextIdx.value;

    if (oldV && newV && (oldV.type !== newV.type || (oldV.type === 'element' && oldV.tagName !== newV.tagName))) {
      nextPatches.push({ type: 'REPLACE', index: currentIndex, oldV, newV, path: nextPath });
      return nextPatches;
    }

    if (oldV && newV && oldV.type === 'text' && newV.type === 'text') {
      if (oldV.text !== newV.text) {
        nextPatches.push({ type: 'TEXT', index: currentIndex, oldText: oldV.text, text: newV.text, path: nextPath });
      }
      return nextPatches;
    }

    if (oldV && newV && oldV.type === 'element') {
      const propDiff = diffProps(oldV.props, newV.props);
      if (propDiff) {
        nextPatches.push({ type: 'PROPS', index: currentIndex, propsDiff: propDiff, path: nextPath });
      }

      const oldChildren = oldV.children || [];
      const newChildren = newV.children || [];
      const maxLength = Math.max(oldChildren.length, newChildren.length);

      for (let index = 0; index < maxLength; index += 1) {
        nextIdx.value += 1;
        const childRef = oldChildren[index] || newChildren[index];
        const childPath = `${nextPath} > ${(childRef && childRef.tagName) || 'text'}[${index}]`;

        if (index >= newChildren.length) {
          nextPatches.push({ type: 'REMOVE', index: nextIdx.value, path: childPath });
          nextIdx.value += countNodes(oldChildren[index]) - 1;
        } else if (index >= oldChildren.length) {
          nextPatches.push({ type: 'INSERT', index: nextIdx.value, newV: newChildren[index], path: childPath });
          nextIdx.value += countNodes(newChildren[index]) - 1;
        } else {
          diffVNodes(oldChildren[index], newChildren[index], nextPatches, nextIdx, childPath);
        }
      }
    }

    return nextPatches;
  }

  // 표시용 텍스트를 짧게 줄이는 함수입니다.
  // 노드 라벨과 요약 카드가 지나치게 길어지면 시각화 밀도가 무너지기 쉬워서, 핵심만 남기고 절단합니다.
  function shorten(value, maxLength = 48) {
    const text = String(value ?? '');
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }

  // VNode 하나를 사람 친화적인 라벨로 바꾸는 함수입니다.
  // 텍스트/엘리먼트 구분이 바로 보여야 트리와 inspector를 동시에 이해하기 쉬워서 라벨 생성 규칙을 한 곳에 모았습니다.
  function getNodeLabel(vnode) {
    if (!vnode) {
      return 'Unknown';
    }

    return vnode.tagName.toUpperCase();
  }

  // props를 inspector용 짧은 문자열 목록으로 바꾸는 함수입니다.
  // 모든 속성을 길게 펼치면 하단 카드가 금방 무너져서, 대표 속성 위주로 요약된 문자열 배열을 생성합니다.
  function getPropSummary(props = {}) {
    const entries = Object.entries(props || {});
    if (!entries.length) {
      return ['(no props)'];
    }

    return entries.slice(0, 6).map(([key, value]) => `${key}: "${shorten(value, 36)}"`);
  }

  // 트리 렌더용 평면 노드 목록과 레벨 정보를 만드는 함수입니다.
  // SVG 배치 계산은 중첩 객체보다 평면 리스트가 다루기 쉬워서, DFS 순회 결과를 layout-friendly 구조로 다시 만듭니다.
  function flattenTree(vnode, depth = 0, bucket = [], indexRef = { value: 0 }, parentIndex = null, path = 'root') {
    if (!vnode) {
      return bucket;
    }

    if (vnode.type === 'text') {
      return bucket;
    }

    const currentIndex = indexRef.value;
    const currentPath = path;
    bucket.push({
      vnode,
      depth,
      index: currentIndex,
      parentIndex,
      path: currentPath
    });

    const children = vnode.children || [];
    children.forEach((child, childIndex) => {
      indexRef.value += 1;
      const childPath = `${currentPath} > ${(child.tagName || 'text')}[${childIndex}]`;
      flattenTree(child, depth + 1, bucket, indexRef, currentIndex, childPath);
    });

    return bucket;
  }

  // 평면 트리를 SVG 좌표가 있는 시각 노드/엣지 구조로 바꾸는 함수입니다.
  // 트리 깊이와 같은 레벨 안의 순서를 좌표로 치환해, 입력 VNode가 달라져도 기본 구조는 자동 배치되게 합니다.
  function buildLayout(flatNodes, changedIndexes) {
    const canvasWidth = 1000;
    const canvasHeight = 620;
    const horizontalPadding = 110;
    const verticalPadding = 88;
    const byDepth = new Map();
    flatNodes.forEach((item) => {
      if (!byDepth.has(item.depth)) {
        byDepth.set(item.depth, []);
      }
      byDepth.get(item.depth).push(item);
    });

    const maxDepth = Math.max(...flatNodes.map((item) => item.depth), 0);
    const nodes = flatNodes.map((item) => {
      const siblings = byDepth.get(item.depth) || [item];
      const siblingIndex = siblings.findIndex((candidate) => candidate.index === item.index);
      const usableWidth = canvasWidth - (horizontalPadding * 2);
      const usableHeight = canvasHeight - (verticalPadding * 2);
      const x = siblings.length === 1
        ? canvasWidth / 2
        : horizontalPadding + ((usableWidth / (siblings.length - 1)) * siblingIndex);
      const y = verticalPadding + ((usableHeight / (maxDepth + 1 || 1)) * item.depth);
      const isChanged = changedIndexes.has(item.index);
      const variant = item.depth === 0 ? 'root' : isChanged ? 'accent' : item.depth % 2 === 0 ? 'secondary' : '';
      const label = getNodeLabel(item.vnode);
      const width = Math.min(Math.max(label.length * 10, 110), 170);

      return {
        id: item.index,
        x,
        y,
        label,
        variant,
        width,
        path: item.path,
        parentIndex: item.parentIndex,
        vnode: item.vnode,
        isChanged
      };
    });

    const edges = nodes
      .filter((node) => node.parentIndex !== null)
      .map((node) => {
        const parent = nodes.find((candidate) => candidate.id === node.parentIndex);
        return {
          x1: parent.x,
          y1: parent.y + 20,
          x2: node.x,
          y2: node.y - 20,
          stroke: node.isChanged ? '#ffffff' : 'rgba(255, 255, 255, 0.88)',
          width: node.isChanged ? 2.4 : 1.9
        };
      });

    return { nodes, edges };
  }

  // patches에서 변경 인덱스만 추출하는 함수입니다.
  // 실제 시각화는 하이라이트된 노드 여부만 있으면 충분한 경우가 많아, 전체 patch를 그대로 들고 다니지 않도록 축약합니다.
  function collectChangedIndexes(patches = []) {
    return new Set((patches || []).map((patch) => patch.index).filter((index) => typeof index === 'number'));
  }

  // 패치 목록에서 가장 대표적인 변경 타입을 뽑는 함수입니다.
  // summary 카드가 단순 텍스트 나열보다 방향성을 보여주도록, 가장 두드러진 변경 종류를 하나 선택합니다.
  function getDominantPatchType(patches = []) {
    const counts = {};
    patches.forEach((patch) => {
      counts[patch.type] = (counts[patch.type] || 0) + 1;
    });
    return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] || 'IDLE';
  }

  // inspector에 넣을 대표 노드를 선택하는 함수입니다.
  // 상세 정보는 사용자가 가장 먼저 궁금해하는 "변경된 노드" 기준이 자연스러워서, 변경 노드를 우선 선택하고 없으면 루트를 사용합니다.
  function pickInspectorNode(layoutNodes) {
    return layoutNodes.find((node) => node.isChanged) || layoutNodes[0] || null;
  }

  // 입력 old/new/patches를 TreesModule용 시각 모델로 변환하는 핵심 함수입니다.
  // 이 함수가 있으면 host는 입력 전달만 담당하고, diff/트리/요약 생성 책임은 모듈 내부에서 일관되게 처리할 수 있습니다.
  function createModel(inputOrOptions = {}) {
    const input = normalizeInput(inputOrOptions);
    const oldVNode = input.oldVNode;
    const newVNode = input.newVNode || input.oldVNode;
    const patches = input.patches || diffVNodes(oldVNode, newVNode);
    const changedIndexes = collectChangedIndexes(patches);
    const flatNodes = flattenTree(newVNode || oldVNode);
    const layout = buildLayout(flatNodes, changedIndexes);
    const inspectorNode = pickInspectorNode(layout.nodes);
    const meta = input.meta || {};
    const hasTreeData = Boolean(input.oldVNode || input.newVNode);
    const isEmpty = !hasTreeData && !patches.length;
    const summaryCopy = meta.summaryCopy || (
      isEmpty
        ? 'Tree 데이터가 아직 전달되지 않았습니다. host 파일에서 oldVNode/newVNode 또는 patches를 넘기면 같은 자리에서 실제 트리로 교체됩니다.'
        : `총 ${layout.nodes.length}개 노드를 기준으로 트리 구조를 생성하고, ${patches.length}개의 patch를 바탕으로 변경 노드를 강조했습니다.`
    );
    const inspector = inspectorNode ? {
      component: inspectorNode.vnode.type === 'text' ? 'text' : inspectorNode.vnode.tagName,
      children: `${(inspectorNode.vnode.children || []).length} NODES`,
      parent: inspectorNode.parentIndex === null
        ? '(root)'
        : (layout.nodes.find((node) => node.id === inspectorNode.parentIndex)?.vnode.tagName || 'unknown'),
      props: inspectorNode.vnode.type === 'text'
        ? [`text: "${shorten(inspectorNode.vnode.text || '', 42)}"`]
        : getPropSummary(inspectorNode.vnode.props)
    } : {
      component: isEmpty ? 'waiting-for-data' : 'unknown',
      children: '0 NODES',
      parent: '(root)',
      props: isEmpty
        ? [
            'oldVNode/newVNode 또는 patches가 아직 전달되지 않았습니다.',
            'host에서 TreesModule.renderInto(container, data)를 다시 호출하면 즉시 갱신됩니다.'
          ]
        : ['(no props)']
    };
    const summaryCards = [
      { label: 'Root', value: newVNode?.tagName || oldVNode?.tagName || (isEmpty ? 'waiting' : 'unknown') },
      { label: 'Patches', value: isEmpty ? 'data pending / dominant NONE' : `${patches.length} changes / dominant ${getDominantPatchType(patches)}` },
      { label: 'Changed', value: isEmpty ? '0 highlighted nodes / waiting' : `${changedIndexes.size} highlighted nodes` }
    ];

    return {
      eyebrow: meta.eyebrow || 'Explorer / Trees',
      title: meta.title || 'VDOM Tree Explorer',
      badge: meta.badge || (isEmpty ? 'WAITING' : getDominantPatchType(patches)),
      searchPlaceholder: 'Search JSX Nodes...',
      summaryTitle: meta.summaryTitle || 'VNode Structure',
      summaryCopy: meta.summaryCopy || `총 ${layout.nodes.length}개 노드를 기준으로 트리 구조를 생성했고, ${patches.length}개의 patch를 바탕으로 변경 노드를 강조했습니다.`,
      inspectorFile: meta.inspectorFile || 'runtime-vdom',
      inspector: inspectorNode ? {
        component: inspectorNode.vnode.type === 'text' ? 'text' : inspectorNode.vnode.tagName,
        children: `${(inspectorNode.vnode.children || []).length} NODES`,
        parent: inspectorNode.parentIndex === null
          ? '(root)'
          : (layout.nodes.find((node) => node.id === inspectorNode.parentIndex)?.vnode.tagName || 'unknown'),
        props: inspectorNode.vnode.type === 'text'
          ? [`text: "${shorten(inspectorNode.vnode.text || '', 42)}"`]
          : getPropSummary(inspectorNode.vnode.props)
      } : {
        component: 'unknown',
        children: '0 NODES',
        parent: '(root)',
        props: ['(no props)']
      },
      summaryCards: [
        { label: 'Root', value: newVNode?.tagName || oldVNode?.tagName || 'unknown' },
        { label: 'Patches', value: `${patches.length} changes / dominant ${getDominantPatchType(patches)}` },
        { label: 'Changed', value: `${changedIndexes.size} highlighted nodes` }
      ],
      nodes: layout.nodes,
      edges: layout.edges,
      patches,
      oldVNode,
      newVNode,
      summaryCopy,
      inspector,
      summaryCards,
      isEmpty,
      emptyStateTitle: meta.emptyStateTitle || 'Tree Data Pending',
      emptyStateCopy: meta.emptyStateCopy || '이 영역은 Tree가 렌더될 자리입니다. 아직 입력 데이터가 없어 기본 프레임만 먼저 표시하고 있습니다.'
    };
  }

  // Trees 패널 전용 CSS를 한 번만 주입하는 함수입니다.
  // Tailwind나 기존 host 스타일에 의존하지 않고 어디에 붙여도 같은 결과가 나오게 하기 위해 모듈이 직접 스타일을 책임집니다.
  function ensureStyles() {
    if (document.getElementById(TREES_STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = TREES_STYLE_ID;
    style.textContent = `
      .trees-module {
        display: grid;
        grid-template-rows: auto 1fr;
        min-height: 320px;
        height: 100%;
        background: var(--bg-panel, #0d1120);
        color: var(--text-primary, #e8f0fe);
      }
      .trees-module__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 18px;
        border-bottom: 1px solid rgba(30, 45, 69, 0.9);
        background: linear-gradient(180deg, rgba(17, 24, 39, 0.88), rgba(13, 17, 32, 0.96));
      }
      .trees-module__title-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .trees-module__title {
        font-family: var(--font-display, 'Syne', sans-serif);
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .trees-module__badge,
      .trees-module__eyebrow {
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(79, 195, 247, 0.22);
        border-radius: 999px;
        padding: 3px 9px;
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .trees-module__badge {
        color: var(--cyan, #0ff5ce);
        background: rgba(79, 195, 247, 0.08);
      }
      .trees-module__eyebrow {
        color: var(--text-secondary, #8898b4);
        border-color: rgba(30, 45, 69, 0.9);
      }
      .trees-module__body {
        display: grid;
        grid-template-columns: minmax(0, 1.18fr) 290px;
        min-height: 0;
      }
      .trees-module__canvas {
        position: relative;
        overflow: hidden;
        min-height: 360px;
        background:
          radial-gradient(circle at top, rgba(79, 195, 247, 0.08), transparent 40%),
          linear-gradient(180deg, rgba(8, 11, 20, 0.96), rgba(13, 17, 32, 0.98));
      }
      .trees-module__svg {
        width: 100%;
        height: 100%;
        min-height: 360px;
      }
      .trees-module__search {
        position: absolute;
        top: 20px;
        left: 20px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(30, 45, 69, 0.9);
        background: rgba(17, 24, 39, 0.72);
        color: var(--text-secondary, #8898b4);
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .trees-module__empty {
        position: absolute;
        inset: 84px 20px 104px;
        display: grid;
        place-items: center;
        pointer-events: none;
      }
      .trees-module__empty-card {
        width: min(420px, 100%);
        border: 1px dashed rgba(79, 195, 247, 0.28);
        border-radius: 16px;
        background: rgba(17, 24, 39, 0.68);
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
        padding: 20px 22px;
        text-align: center;
      }
      .trees-module__empty-label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
        border: 1px solid rgba(79, 195, 247, 0.22);
        border-radius: 999px;
        padding: 4px 10px;
        color: var(--cyan, #0ff5ce);
        background: rgba(79, 195, 247, 0.08);
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .trees-module__empty-title {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .trees-module__empty-copy {
        margin: 0;
        color: var(--text-secondary, #8898b4);
        font-size: 13px;
        line-height: 1.65;
      }
      .trees-module__inspector {
        position: absolute;
        left: 20px;
        bottom: 20px;
        width: min(280px, calc(100% - 40px));
        border: 1px solid rgba(30, 45, 69, 0.9);
        border-radius: 10px;
        background: rgba(17, 24, 39, 0.9);
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28);
        padding: 14px;
      }
      .trees-module__inspector-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 10px;
      }
      .trees-module__inspector-title,
      .trees-module__summary-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--text-secondary, #8898b4);
      }
      .trees-module__inspector-chip {
        border-radius: 999px;
        padding: 3px 8px;
        background: rgba(79, 195, 247, 0.08);
        color: var(--cyan, #0ff5ce);
        font-size: 10px;
      }
      .trees-module__inspector-grid {
        display: grid;
        gap: 8px;
        font-family: var(--font-mono, 'JetBrains Mono', monospace);
        font-size: 11px;
        color: var(--text-secondary, #8898b4);
      }
      .trees-module__inspector-row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }
      .trees-module__props {
        padding-top: 8px;
        border-top: 1px solid rgba(30, 45, 69, 0.7);
      }
      .trees-module__props-box {
        margin-top: 6px;
        padding: 8px 10px;
        border-radius: 8px;
        background: rgba(8, 11, 20, 0.9);
        border: 1px solid rgba(30, 45, 69, 0.8);
        line-height: 1.6;
      }
      .trees-module__summary {
        border-left: 1px solid rgba(30, 45, 69, 0.9);
        background: linear-gradient(180deg, rgba(17, 24, 39, 0.88), rgba(8, 11, 20, 0.98));
        padding: 22px 18px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        overflow: auto;
      }
      .trees-module__summary-title {
        font-family: var(--font-display, 'Syne', sans-serif);
        font-size: 28px;
        line-height: 1.05;
      }
      .trees-module__summary-copy {
        color: var(--text-secondary, #8898b4);
        font-size: 12px;
        line-height: 1.75;
      }
      .trees-module__card {
        border: 1px solid rgba(30, 45, 69, 0.9);
        border-radius: 10px;
        background: rgba(17, 24, 39, 0.76);
        padding: 14px;
      }
      .trees-module__card-value {
        color: var(--text-primary, #e8f0fe);
        font-size: 14px;
        line-height: 1.55;
      }
      .trees-module__svg-line { stroke-linecap: round; }
      .trees-module__node-label {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        height: 42px;
        width: 100%;
        padding: 0 12px;
        box-sizing: border-box;
        border: 1px solid rgba(30, 45, 69, 0.9);
        background: rgba(17, 24, 39, 0.86);
        color: var(--text-primary, #e8f0fe);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .trees-module__node-label--root {
        color: var(--cyan, #0ff5ce);
        border-color: rgba(79, 195, 247, 0.4);
        background: rgba(79, 195, 247, 0.08);
      }
      .trees-module__node-label--accent {
        color: #9bd7ff;
        border-color: rgba(79, 195, 247, 0.3);
      }
      .trees-module__node-label--secondary {
        color: #8ceab9;
        border-color: rgba(105, 240, 174, 0.3);
      }
      @media (max-width: 1100px) {
        .trees-module__body { grid-template-columns: 1fr; }
        .trees-module__summary {
          border-left: none;
          border-top: 1px solid rgba(30, 45, 69, 0.9);
        }
      }
    `;

    document.head.appendChild(style);
  }

  // SVG 노드 박스 클래스명을 조합하는 함수입니다.
  // 루트/변경/일반 노드의 시각 구분을 variant 규칙 하나로 통일하면, 이후 테마 조정과 React 이관이 훨씬 단순해집니다.
  function getNodeClass(variant) {
    return ['trees-module__node-label', variant ? `trees-module__node-label--${variant}` : '']
      .filter(Boolean)
      .join(' ');
  }

  // 모델을 HTML 문자열로 렌더하는 함수입니다.
  // 문자열 렌더 경로를 유지해야 다른 HTML 파일에 직접 주입할 때와 서버성 렌더링 상황을 같은 API로 커버할 수 있습니다.
  function renderToString(inputOrOptions = {}) {
    const model = inputOrOptions.nodes ? inputOrOptions : createModel(inputOrOptions);

    const edgeMarkup = model.edges.map((edge) => `
      <line class="trees-module__svg-line" x1="${edge.x1}" y1="${edge.y1}" x2="${edge.x2}" y2="${edge.y2}" stroke="${edge.stroke}" stroke-width="${edge.width}"></line>
    `).join('');

    const nodeMarkup = model.nodes.map((node) => `
      <foreignObject width="${node.width || 118}" height="44" x="${node.x - ((node.width || 118) / 2)}" y="${node.y - 22}">
        <div xmlns="http://www.w3.org/1999/xhtml" class="${getNodeClass(node.variant)}" title="${escapeHtml(node.path)}">${escapeHtml(node.label)}</div>
      </foreignObject>
    `).join('');

    const summaryCards = model.summaryCards.map((card) => `
      <div class="trees-module__card">
        <span class="trees-module__summary-label">${escapeHtml(card.label)}</span>
        <p class="trees-module__card-value">${escapeHtml(card.value)}</p>
      </div>
    `).join('');

    const propsMarkup = (model.inspector.props || []).map((prop) => escapeHtml(prop)).join('<br/>');
    const emptyMarkup = model.isEmpty ? `
      <div class="trees-module__empty">
        <div class="trees-module__empty-card">
          <span class="trees-module__empty-label">Awaiting Input</span>
          <h3 class="trees-module__empty-title">${escapeHtml(model.emptyStateTitle)}</h3>
          <p class="trees-module__empty-copy">${escapeHtml(model.emptyStateCopy)}</p>
        </div>
      </div>
    ` : '';

    return `
      <section class="trees-module" data-trees-module-root>
        <header class="trees-module__header">
          <div class="trees-module__title-wrap">
            <span class="material-symbols-outlined" aria-hidden="true">account_tree</span>
            <h2 class="trees-module__title">${escapeHtml(model.title)}</h2>
            <span class="trees-module__badge">${escapeHtml(model.badge)}</span>
          </div>
          <span class="trees-module__eyebrow">${escapeHtml(model.eyebrow)}</span>
        </header>
        <div class="trees-module__body">
          <section class="trees-module__canvas">
            <div class="trees-module__search">
              <span class="material-symbols-outlined" aria-hidden="true">search</span>
              <span>${escapeHtml(model.searchPlaceholder)}</span>
            </div>
            <svg class="trees-module__svg" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              ${edgeMarkup}
              ${nodeMarkup}
            </svg>
            ${emptyMarkup}
            <div class="trees-module__inspector">
              <div class="trees-module__inspector-head">
                <span class="trees-module__inspector-title">Node Inspector</span>
                <span class="trees-module__inspector-chip">${escapeHtml(model.inspectorFile)}</span>
              </div>
              <div class="trees-module__inspector-grid">
                <div class="trees-module__inspector-row"><span>COMPONENT</span><strong>${escapeHtml(model.inspector.component)}</strong></div>
                <div class="trees-module__inspector-row"><span>CHILDREN</span><strong>${escapeHtml(model.inspector.children)}</strong></div>
                <div class="trees-module__inspector-row"><span>PARENT</span><strong>${escapeHtml(model.inspector.parent)}</strong></div>
                <div class="trees-module__props">
                  <span>PROPS</span>
                  <div class="trees-module__props-box">${propsMarkup}</div>
                </div>
              </div>
            </div>
          </section>
          <aside class="trees-module__summary">
            <div>
              <span class="trees-module__summary-label">Tree Summary</span>
              <h3 class="trees-module__summary-title">${escapeHtml(model.summaryTitle)}</h3>
              <p class="trees-module__summary-copy">${escapeHtml(model.summaryCopy)}</p>
            </div>
            ${summaryCards}
          </aside>
        </div>
      </section>
    `;
  }

  // 전달받은 container에 Trees 패널을 실제로 주입하는 함수입니다.
  // host 파일은 이 함수 하나만 호출하면 되도록, 스타일 보장과 DOM 주입을 같은 진입점에 묶었습니다.
  function renderInto(container, inputOrOptions = {}) {
    if (!container) {
      return null;
    }

    ensureStyles();
    container.innerHTML = renderToString(inputOrOptions);
    return container.querySelector('[data-trees-module-root]');
  }

  // Sidebar 전환 모듈에 Trees 렌더러를 자동 등록하는 함수입니다.
  // host가 이미 registerViewRenderer 확장점을 갖고 있으면 연결 코드 중복을 줄이기 위해 이 helper를 제공합니다.
  function registerToSidebar(options = {}) {
    if (!window.__indexSidebarMigration?.registerViewRenderer) {
      return false;
    }

    window.__indexSidebarMigration.registerViewRenderer('Trees', (container) => {
      renderInto(container, options);
    });
    return true;
  }

  window.TreesModule = {
    registerAdapter,
    normalizeInput,
    diffVNodes,
    createModel,
    ensureStyles,
    renderToString,
    renderInto,
    registerToSidebar
  };
})();
