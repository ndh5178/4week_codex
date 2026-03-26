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
  const journalStateByContainer = new WeakMap();
  const JOURNAL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const JOURNAL_DAY_LABELS = {
    Monday: '월',
    Tuesday: '화',
    Wednesday: '수',
    Thursday: '목',
    Friday: '금',
    Saturday: '토',
    Sunday: '일'
  };

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

  function walkVNode(node, visit) {
    if (!node) {
      return;
    }
    visit(node);
    const children = Array.isArray(node.children) ? node.children : [];
    children.forEach((child) => walkVNode(child, visit));
  }

  function getClassName(node) {
    if (!node || !node.props) {
      return '';
    }
    return String(node.props.class || node.props.className || '');
  }

  function getTextContent(node) {
    if (!node) {
      return '';
    }

    if (node.type === 'text') {
      return String(node.text || '').trim();
    }

    return (node.children || [])
      .map((child) => getTextContent(child))
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function findFirstVNode(node, predicate) {
    let matched = null;
    walkVNode(node, (candidate) => {
      if (!matched && predicate(candidate)) {
        matched = candidate;
      }
    });
    return matched;
  }

  function findAllVNodes(node, predicate) {
    const matches = [];
    walkVNode(node, (candidate) => {
      if (predicate(candidate)) {
        matches.push(candidate);
      }
    });
    return matches;
  }

  function hasNodeKey(node, key) {
    return node?.key === key || node?.props?.['data-key'] === key;
  }

  // text/element 여부를 판별하는 기본 VNode 정규화 함수입니다.
  // 프로젝트마다 필드 이름이 약간씩 달라도 최소한의 표준 형식으로 맞춰야 내부 diff와 트리 생성 로직을 재사용할 수 있습니다.
  function normalizeVNode(node) {
    if (!node) {
      return null;
    }

    if (node.type === 'text' || node.type === 'TEXT' || typeof node.text === 'string' || typeof node.value === 'string') {
      return {
        type: 'text',
        text: String(node.text ?? node.value ?? ''),
        key: node.key ?? null
      };
    }

    return {
      type: 'element',
      tagName: String(node.tagName || node.tag || node.name || 'node').toLowerCase(),
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
        ...(input.meta || {}),
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

  function detectJournalTree(vnode) {
    const dayButtons = findAllVNodes(vnode, (candidate) => {
      const day = candidate?.props?.['data-day'];
      return candidate?.type === 'element' && JOURNAL_DAYS.includes(day);
    });
    return dayButtons.length >= 3;
  }

  function getActiveJournalDay(vnode) {
    const buttons = findAllVNodes(vnode, (candidate) => {
      const day = candidate?.props?.['data-day'];
      return candidate?.type === 'element' && JOURNAL_DAYS.includes(day);
    });

    const activeButton = buttons.find((button) => {
      const className = getClassName(button);
      return className.includes('bg-primary') && className.includes('text-white');
    });

    return activeButton?.props?.['data-day'] || buttons[0]?.props?.['data-day'] || null;
  }

  function getJournalSectionSummary(vnode) {
    const daytimeSection = findFirstVNode(vnode, (candidate) => hasNodeKey(candidate, 'daytime-section'));
    const nightSection = findFirstVNode(vnode, (candidate) => hasNodeKey(candidate, 'night-section'));
    const comparePanel = findFirstVNode(vnode, (candidate) => hasNodeKey(candidate, 'compare-panel'));
    const daytimeList = findFirstVNode(vnode, (candidate) => hasNodeKey(candidate, 'daytime-list'));
    const nightList = findFirstVNode(vnode, (candidate) => hasNodeKey(candidate, 'night-list'));

    const daytimeItems = (daytimeList?.children || [])
      .map((child) => getTextContent(child))
      .filter(Boolean);
    const nightItems = (nightList?.children || [])
      .map((child) => getTextContent(child))
      .filter(Boolean);
    const compareText = getTextContent(comparePanel);

    const sectionNode = daytimeSection || nightSection || comparePanel;
    const tagName = sectionNode?.tagName || 'section';
    const dataKey = sectionNode?.props?.['data-key'] ? ` data-key="${sectionNode.props['data-key']}"` : '';

    return {
      tagLabel: `<${tagName}${dataKey}>`,
      text: shorten([daytimeItems[0], nightItems[0]].filter(Boolean).join(' | ') || compareText || '(text pending)', 260),
      daytimeItems: daytimeItems.length ? daytimeItems : ['(none)'],
      nightItems: nightItems.length ? nightItems : ['(none)']
    };
  }

  function getJournalTitleText(vnode) {
    const headerNode = findFirstVNode(vnode, (candidate) => hasNodeKey(candidate, 'header'));
    const titleNode = findFirstVNode(headerNode || vnode, (candidate) => candidate?.tagName === 'h2');
    const fallbackNode = findFirstVNode(headerNode || vnode, (candidate) => candidate?.tagName === 'h1');
    return getTextContent(titleNode || fallbackNode || headerNode);
  }

  function createChangeEventSignature(type, day, value) {
    return `${type}::${day || 'root'}::${value || ''}`;
  }

  function createElbowPath(startX, startY, laneX, endX, endY) {
    return [
      `M ${startX} ${startY}`,
      `L ${laneX} ${startY}`,
      `L ${laneX} ${endY}`,
      `L ${endX} ${endY}`
    ].join(' ');
  }

  function buildJournalChangeEvents(input, state, activeDay) {
    const meta = input.meta || {};
    if (meta.source !== 'patch-apply') {
      return;
    }

    const oldSummary = input.oldVNode ? getJournalSectionSummary(input.oldVNode) : null;
    const newSummary = input.newVNode ? getJournalSectionSummary(input.newVNode) : null;
    const oldTitle = input.oldVNode ? getJournalTitleText(input.oldVNode) : '';
    const newTitle = input.newVNode ? getJournalTitleText(input.newVNode) : '';

    if (oldTitle !== newTitle && (oldTitle || newTitle)) {
      const signature = createChangeEventSignature('title-edit', null, `${oldTitle}=>${newTitle}`);
      if (!state.changeEventKeys.has(signature)) {
        state.changeEventKeys.add(signature);
        state.changeEvents.push({
          type: 'title-edit',
          parentType: 'root',
          label: 'Title Edit',
          signature,
          detail: {
            modalTitle: 'Title Edit',
            rows: [
              ['TYPE', 'TITLE EDIT'],
              ['FROM', oldTitle],
              ['TO', newTitle]
            ],
            textBlocks: [
              { label: 'BEFORE', value: oldTitle },
              { label: 'AFTER', value: newTitle }
            ]
          }
        });
      }
    }

    const day = activeDay || getActiveJournalDay(input.newVNode || input.oldVNode);
    if (!day || !oldSummary || !newSummary) {
      return;
    }

    const normalizeItems = (items = []) => items.filter((item) => item && item !== '(none)');

    const collectAddedItems = (beforeItems = [], afterItems = []) => {
      const counts = new Map();
      normalizeItems(beforeItems).forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
      const added = [];
      normalizeItems(afterItems).forEach((item) => {
        const nextCount = counts.get(item) || 0;
        if (nextCount > 0) {
          counts.set(item, nextCount - 1);
        } else {
          added.push(item);
        }
      });
      return added;
    };

    const addedItems = [
      ...collectAddedItems(oldSummary.daytimeItems, newSummary.daytimeItems).map((item) => ({ section: 'Daytime', item })),
      ...collectAddedItems(oldSummary.nightItems, newSummary.nightItems).map((item) => ({ section: 'Night', item }))
    ];

    addedItems.forEach(({ section, item }) => {
      const signature = createChangeEventSignature('schedule-add', day, `${section}:${item}`);
      if (state.changeEventKeys.has(signature)) {
        return;
      }
      state.changeEventKeys.add(signature);
      state.changeEvents.push({
        type: 'schedule-add',
        parentType: 'day',
        parentDay: day,
        label: 'Schedule Add',
        signature,
        detail: {
          modalTitle: `${day} ${section} Added`,
          rows: [
            ['TYPE', 'SCHEDULE ADD'],
            ['DAY', `${day} (${JOURNAL_DAY_LABELS[day] || day})`],
            ['SECTION', section]
          ],
          textBlocks: [
            { label: 'LABEL', value: `${section} +` },
            { label: 'ITEM', value: item }
          ]
        }
      });
    });
  }

  function createJournalNodeDetail(day, summary, isActive, visitedCount) {
    return {
      modalTitle: day ? `${day} Detail` : 'Weekly Travel Journal',
      rows: day ? [
        ['DAY', `${day} (${JOURNAL_DAY_LABELS[day] || day})`],
        ['TAG', summary.tagLabel],
        ['STATE', isActive ? 'ACTIVE' : 'VISITED']
      ] : [
        ['ROOT', 'Weekly Travel Journal'],
        ['VISITED', `${visitedCount} days`],
        ['FLOW', 'Root -> Title Edit / Day -> Schedule Add']
      ],
      textBlocks: day ? [
        { label: 'TEXT', value: summary.text },
        { label: 'DAYTIME', value: (summary.daytimeItems || ['(none)']).join('\n') },
        { label: 'NIGHT', value: (summary.nightItems || ['(none)']).join('\n') }
      ] : [
        { label: 'SUMMARY', value: '요일을 누를 때마다 해당 요일 노드가 생성되고, 클릭하면 대표 영역 태그와 텍스트를 볼 수 있습니다.' }
      ]
    };
  }

  function createJournalModel(input, container) {
    const sourceVNode = input.newVNode || input.oldVNode || null;
    const previousVNode = input.oldVNode || null;
    const activeDay = getActiveJournalDay(sourceVNode);
    const canvasWidth = 1180;
    const baseCanvasHeight = 440;
    const titleRailWidth = 240;
    const dayAreaWidth = canvasWidth - titleRailWidth;
    const rootX = dayAreaWidth / 2;
    const rootY = 92;
    const dayY = 280;
    const state = container
      ? (journalStateByContainer.get(container) || { visitedDays: new Map(), changeEvents: [], changeEventKeys: new Set() })
      : { visitedDays: new Map(), changeEvents: [], changeEventKeys: new Set() };

    if (activeDay) {
      state.visitedDays.set(activeDay, getJournalSectionSummary(sourceVNode));
      if (container) {
        journalStateByContainer.set(container, state);
      }
    }

    buildJournalChangeEvents(input, state, activeDay);
    if (container) {
      journalStateByContainer.set(container, state);
    }

    const visitedDays = JOURNAL_DAYS.filter((day) => state.visitedDays.has(day));
    const rootNode = {
      id: 0,
      x: rootX,
      y: rootY,
      width: 240,
      label: 'Weekly Travel Journal',
      variant: 'root',
      path: 'root',
      parentIndex: null,
      depth: 0,
      vnode: sourceVNode || previousVNode || { type: 'element', tagName: 'app-root', props: {}, children: [] },
      isChanged: false,
      detail: createJournalNodeDetail(null, null, false, visitedDays.length)
    };

    const dayNodes = visitedDays.map((day, index) => {
      const count = visitedDays.length;
      const leftPad = count >= 6 ? 78 : 104;
      const rightPad = count >= 6 ? 64 : 92;
      const usableWidth = dayAreaWidth - leftPad - rightPad;
      const spacing = count === 1 ? 0 : usableWidth / Math.max(count - 1, 1);
      const x = count === 1 ? rootX : leftPad + (spacing * index);
      const summary = state.visitedDays.get(day);
      const isActive = day === activeDay;
      return {
        id: index + 1,
        x,
        y: dayY,
        width: count >= 6 ? 128 : 140,
        label: `${day.slice(0, 3)} ${JOURNAL_DAY_LABELS[day] || day}`,
        variant: isActive ? 'accent' : 'secondary',
        path: `root > ${day}`,
        parentIndex: 0,
        depth: 1,
        vnode: sourceVNode || previousVNode || { type: 'element', tagName: 'section', props: {}, children: [] },
        isChanged: isActive,
        detail: createJournalNodeDetail(day, summary, isActive, visitedDays.length)
      };
    });

    const changeNodes = [];
    const changeEdges = [];
    const rootChangeEvents = state.changeEvents.filter((event) => event.parentType === 'root');
    const titleColumnX = dayAreaWidth + (titleRailWidth / 2);
    const titleParentY = dayY;
    const titleEventStartY = titleParentY + 102;
    const titleEventGapY = 82;

    if (rootChangeEvents.length) {
      const titleParentId = 'change-root-parent';
      changeNodes.push({
        id: titleParentId,
        x: titleColumnX,
        y: titleParentY,
        width: 126,
        label: 'Title Edit',
        variant: 'secondary',
        path: 'root > Title Edit',
        parentIndex: 0,
        depth: 1,
        vnode: { type: 'element', tagName: 'change-group', props: {}, children: [] },
        isChanged: true,
        detail: {
          modalTitle: 'Title Edit History',
          rows: [
            ['TYPE', 'TITLE EDIT HISTORY'],
            ['COUNT', `${rootChangeEvents.length}`]
          ],
          textBlocks: rootChangeEvents.map((event, index) => ({
            label: `EDIT ${index + 1}`,
            value: `${event.detail?.rows?.[1]?.[1] || ''} -> ${event.detail?.rows?.[2]?.[1] || ''}`.trim()
          }))
        }
      });
      changeEdges.push({
        x1: rootX,
        y1: rootY + 24,
        x2: titleColumnX,
        y2: titleParentY - 24,
        stroke: '#ce93d8',
        width: 2.2
      });
    }

    rootChangeEvents.forEach((event, index) => {
      const x = titleColumnX;
      const y = titleEventStartY + (titleEventGapY * index);
      const nodeId = `change-root-${index}`;
      changeNodes.push({
        id: nodeId,
        x,
        y,
        width: 118,
        label: `Edit ${index + 1}`,
        variant: 'secondary',
        path: `root > Title Edit > Edit ${index + 1}`,
        parentIndex: 'change-root-parent',
        depth: 2,
        vnode: { type: 'element', tagName: 'change-node', props: {}, children: [] },
        isChanged: true,
        detail: event.detail
      });
      changeEdges.push({
        path: createElbowPath(
          titleColumnX + 68,
          titleParentY + 10,
          titleColumnX + 94,
          x + 60,
          y - 22
        ),
        stroke: '#ce93d8',
        width: 2.2
      });
    });

    dayNodes.forEach((dayNode) => {
      const relatedEvents = state.changeEvents.filter((event) => event.parentType === 'day' && event.parentDay === visitedDays[dayNode.id - 1]);
      relatedEvents.forEach((event, index) => {
        const x = dayNode.x;
        const y = dayNode.y + 108 + (index * 82);
        const nodeId = `change-day-${dayNode.id}-${index}`;
        changeNodes.push({
          id: nodeId,
          x,
          y,
          width: 122,
          label: `${event.label} ${index + 1}`,
          variant: 'accent',
          path: `${dayNode.path} > ${event.label} ${index + 1}`,
          parentIndex: dayNode.id,
          depth: 2,
          vnode: { type: 'element', tagName: 'change-node', props: {}, children: [] },
          isChanged: true,
          detail: event.detail
        });
        changeEdges.push({
          path: createElbowPath(
            dayNode.x - 70,
            dayNode.y + 8,
            dayNode.x - 94,
            x - 62,
            y - 22
          ),
          stroke: '#0ff5ce',
          width: 2
        });
      });
    });

    const edges = dayNodes.map((node) => ({
      x1: rootX,
      y1: rootY + 24,
      x2: node.x,
      y2: dayY - 26,
      stroke: node.isChanged ? '#ffffff' : 'rgba(255, 255, 255, 0.88)',
      width: node.isChanged ? 2.4 : 1.9
    })).concat(changeEdges);

    const lastRootEventY = rootChangeEvents.length
      ? titleEventStartY + (titleEventGapY * (rootChangeEvents.length - 1))
      : 0;
    const lastDayEventY = dayNodes.reduce((maxY, dayNode) => {
      const relatedCount = state.changeEvents.filter((event) => event.parentType === 'day' && event.parentDay === visitedDays[dayNode.id - 1]).length;
      if (!relatedCount) {
        return maxY;
      }
      return Math.max(maxY, dayNode.y + 108 + ((relatedCount - 1) * 82));
    }, 0);
    const canvasHeight = Math.max(
      baseCanvasHeight,
      changeNodes.length ? 560 : 0,
      lastRootEventY ? lastRootEventY + 120 : 0,
      lastDayEventY ? lastDayEventY + 120 : 0
    );

    return {
      mode: 'journal',
      eyebrow: input.meta?.eyebrow || 'Explorer / Weekly Flow',
      title: input.meta?.title || 'VDOM Tree Explorer',
      badge: activeDay ? `${JOURNAL_DAY_LABELS[activeDay] || activeDay} ACTIVE` : 'WAITING',
      canvasWidth,
      canvasHeight,
      summaryCopy: input.meta?.summaryCopy || (
        visitedDays.length
          ? `방문한 요일 ${visitedDays.length}개를 누적해서 보여주고 있습니다. 현재 활성 요일은 ${activeDay || visitedDays[visitedDays.length - 1]} 입니다.`
          : '새 탭에서 요일을 누르면 해당 요일 노드가 생성됩니다.'
      ),
      nodes: [rootNode, ...dayNodes, ...changeNodes],
      edges,
      patches: Array.isArray(input.patches) ? input.patches : [],
      oldVNode: input.oldVNode,
      newVNode: input.newVNode,
      isEmpty: !visitedDays.length,
      emptyStateTitle: input.meta?.emptyStateTitle || 'Day Nodes Pending',
      emptyStateCopy: input.meta?.emptyStateCopy || '새 탭에서 요일을 클릭하면 해당 요일 노드가 아래에 추가됩니다.'
    };
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
    const container = inputOrOptions.__container || null;
    const journalSource = input.newVNode || input.oldVNode;
    if (journalSource && detectJournalTree(journalSource)) {
      return createJournalModel(input, container);
    }
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

    return {
      canvasWidth: 1000,
      eyebrow: meta.eyebrow || 'Explorer / Trees',
      title: meta.title || 'VDOM Tree Explorer',
      badge: meta.badge || (isEmpty ? 'WAITING' : getDominantPatchType(patches)),
      summaryCopy: meta.summaryCopy || `총 ${layout.nodes.length}개 노드를 기준으로 트리 구조를 생성했고, ${patches.length}개의 patch를 바탕으로 변경 노드를 강조했습니다.`,
      nodes: layout.nodes,
      edges: layout.edges,
      patches,
      oldVNode,
      newVNode,
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
        position: relative;
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
      .trees-module__body { display: grid; min-height: 0; }
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
      .trees-module--journal .trees-module__canvas {
        min-height: 460px;
      }
      .trees-module--journal .trees-module__svg {
        min-height: 460px;
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
      .trees-module__svg-line { stroke-linecap: round; }
      .trees-module__node-label {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
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
      .trees-module--journal .trees-module__node-label {
        height: 46px;
        border-radius: 14px;
        font-size: 12px;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
      }
      .trees-module--journal .trees-module__node-label--root {
        background: linear-gradient(180deg, rgba(79, 195, 247, 0.18), rgba(79, 195, 247, 0.08));
      }
      .trees-module--journal .trees-module__node-label--accent {
        background: rgba(79, 195, 247, 0.14);
      }
      .trees-module--journal .trees-module__node-label--secondary {
        background: rgba(105, 240, 174, 0.12);
      }
      .trees-module__node-label:hover {
        filter: brightness(1.06);
      }
      .trees-module__node-modal-backdrop {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        background: rgba(6, 12, 22, 0.6);
        backdrop-filter: blur(1px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
        z-index: 30;
      }
      .trees-module__node-modal-backdrop.is-open {
        opacity: 1;
        pointer-events: auto;
      }
      .trees-module__node-modal {
        width: min(500px, 90vw);
        border: 1px solid rgba(30, 45, 69, 0.9);
        border-radius: 14px;
        background: linear-gradient(180deg, rgba(17, 24, 39, 0.98), rgba(8, 11, 20, 0.99));
        color: var(--text-primary, #e8f0fe);
        box-shadow: 0 24px 90px rgba(0, 0, 0, 0.4);
        padding: 16px;
      }
      .trees-module__node-modal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
      .trees-module__node-modal-title {
        margin: 0;
        font-size: 14px;
        font-weight: 800;
      }
      .trees-module__node-modal-close {
        border: 1px solid rgba(79, 195, 247, 0.28);
        border-radius: 8px;
        background: rgba(79, 195, 247, 0.08);
        color: var(--text-primary, #e8f0fe);
        padding: 4px 8px;
        cursor: pointer;
      }
      .trees-module__node-modal ul {
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .trees-module__node-modal li {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 6px 0;
        border-bottom: 1px solid rgba(30, 45, 69, 0.7);
      }
      .trees-module__modal-label {
        color: var(--text-secondary, #8898b4);
        font-size: 11px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .trees-module__node-modal pre {
        margin: 8px 0 0;
        white-space: pre-wrap;
        max-height: 120px;
        overflow: auto;
        border-radius: 10px;
        border: 1px solid rgba(30, 45, 69, 0.9);
        background: rgba(8, 11, 20, 0.95);
        padding: 10px;
        font-size: 11px;
        line-height: 1.5;
      }
      @media (max-width: 1100px) { .trees-module__body { min-height: 0; } }
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

  function safeStringify(value) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  function buildNodeModalMarkup(node = {}) {
    if (node.detail) {
      const rows = (node.detail.rows || [])
        .map(([label, value]) => `<li><span class="trees-module__modal-label">${escapeHtml(label)}</span><span>${escapeHtml(String(value))}</span></li>`)
        .join('');
      const textBlocks = (node.detail.textBlocks || [])
        .map((block) => `
          <div class="trees-module__modal-props">
            <div class="trees-module__modal-label">${escapeHtml(block.label)}</div>
            <pre>${escapeHtml(block.value || '(empty)')}</pre>
          </div>
        `)
        .join('');

      return `
        <div class="trees-module__modal-meta">
          <ul>${rows}</ul>
        </div>
        ${textBlocks}
      `;
    }

    const vnode = node.vnode || {};
    const variant = vnode.type === 'text' ? 'text' : (vnode.tagName || 'element');
    const path = node.path || '';
    const props = vnode.props || {};
    const parentIndex = node.parentIndex === null ? '(none)' : String(node.parentIndex);

    const propPairs = Object.keys(props)
      .sort()
      .map((key) => `${key}: ${safeStringify(props[key])}`);
    const propText = propPairs.length ? propPairs.join('\n') : '(no props)';

    const lines = [
      `<li><span class="trees-module__modal-label">ID</span><span>${escapeHtml(String(node.id))}</span></li>`,
      `<li><span class="trees-module__modal-label">TYPE</span><span>${escapeHtml(variant)}</span></li>`,
      `<li><span class="trees-module__modal-label">LABEL</span><span>${escapeHtml(node.label || '(empty)')}</span></li>`,
      `<li><span class="trees-module__modal-label">DEPTH</span><span>${escapeHtml(String(node.depth || 0))}</span></li>`,
      `<li><span class="trees-module__modal-label">CHANGED</span><span>${escapeHtml(node.isChanged ? 'YES' : 'NO')}</span></li>`,
      `<li><span class="trees-module__modal-label">PARENT</span><span>${escapeHtml(parentIndex)}</span></li>`,
      `<li><span class="trees-module__modal-label">PATH</span><span>${escapeHtml(path || '(unknown)')}</span></li>`
    ].join('');

    return `
      <div class="trees-module__modal-meta">
        <ul>${lines}</ul>
      </div>
      <div class="trees-module__modal-props">
        <div class="trees-module__modal-label">PROPS</div>
        <pre>${escapeHtml(propText)}</pre>
      </div>
    `;
  }

  function openNodeModal(root, node) {
    const modal = root.querySelector('[data-trees-node-modal]');
    const modalBody = root.querySelector('[data-trees-node-modal-body]');
    const modalBackdrop = root.querySelector('[data-trees-node-modal-backdrop]');
    const modalTitle = root.querySelector('[data-trees-node-modal-title]');

    if (!modal || !modalBody || !modalBackdrop) {
      return;
    }

    if (modalTitle) {
      modalTitle.textContent = node?.detail?.modalTitle || 'VNode Detail';
    }
    modalBody.innerHTML = node ? buildNodeModalMarkup(node) : '<p>No node data.</p>';
    modalBackdrop.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeNodeModal(root) {
    const modal = root.querySelector('[data-trees-node-modal]');
    const modalBackdrop = root.querySelector('[data-trees-node-modal-backdrop]');

    if (!modal || !modalBackdrop) {
      return;
    }

    modalBackdrop.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function bindTreeNodeModal(root, nodes) {
    const modalBackdrop = root.querySelector('[data-trees-node-modal-backdrop]');
    const closeButton = root.querySelector('[data-trees-node-modal-close]');
    if (!modalBackdrop) {
      return;
    }

    const nodeById = new Map(nodes.map((node) => [String(node.id), node]));

    const onCanvasClick = (event) => {
      const target = event.target.closest('[data-trees-node-id]');
      if (!target) {
        return;
      }
      event.preventDefault();
      const nodeId = target.getAttribute('data-trees-node-id');
      const node = nodeById.get(String(nodeId));
      if (node) {
        openNodeModal(root, node);
      }
    };

    const onClose = (event) => {
      if (event.target === closeButton || closeButton?.contains(event.target)) {
        closeNodeModal(root);
        return;
      }
      if (event.target.closest('[data-trees-node-modal]')) {
        return;
      }
      closeNodeModal(root);
    };

    const onEscape = (event) => {
      if (event.key === 'Escape') {
        closeNodeModal(root);
      }
    };

    const onCloseButton = () => closeNodeModal(root);
    const onMountedRoot = root;
    onMountedRoot.addEventListener('click', onCanvasClick);
    modalBackdrop.addEventListener('click', onClose);
    window.addEventListener('keydown', onEscape);
    closeButton?.addEventListener('click', onCloseButton);

    root.__treesCleanup = () => {
      onMountedRoot.removeEventListener('click', onCanvasClick);
      modalBackdrop.removeEventListener('click', onClose);
      window.removeEventListener('keydown', onEscape);
      closeButton?.removeEventListener('click', onCloseButton);
    };
  }

  // 모델을 HTML 문자열로 렌더하는 함수입니다.
  // 문자열 렌더 경로를 유지해야 다른 HTML 파일에 직접 주입할 때와 서버성 렌더링 상황을 같은 API로 커버할 수 있습니다.
  function renderToString(inputOrOptions = {}) {
    const model = Array.isArray(inputOrOptions.nodes) ? inputOrOptions : createModel(inputOrOptions);
    const safeModel = {
      ...model,
      nodes: Array.isArray(model.nodes) ? model.nodes : [],
      edges: Array.isArray(model.edges) ? model.edges : [],
      emptyStateTitle: model.emptyStateTitle || 'Tree Data Pending',
      emptyStateCopy: model.emptyStateCopy || 'Tree data is not ready yet.',
      title: model.title || 'VDOM Tree Explorer',
      eyebrow: model.eyebrow || 'Explorer / Trees',
      badge: model.badge || 'WAITING',
      isEmpty: Boolean(model.isEmpty),
      mode: model.mode || 'default',
      canvasHeight: model.canvasHeight || 620
    };
    const safeNodes = safeModel.nodes;
    const safeEdges = safeModel.edges;
    const sectionClass = `trees-module${safeModel.mode === 'journal' ? ' trees-module--journal' : ''}`;

    const edgeMarkup = safeEdges.map((edge) => edge.path
      ? `
      <path class="trees-module__svg-line" d="${edge.path}" stroke="${edge.stroke}" stroke-width="${edge.width}" fill="none"></path>
    `
      : `
      <line class="trees-module__svg-line" x1="${edge.x1}" y1="${edge.y1}" x2="${edge.x2}" y2="${edge.y2}" stroke="${edge.stroke}" stroke-width="${edge.width}"></line>
    `
    ).join('');

    const nodeMarkup = safeNodes.map((node) => `
      <foreignObject width="${node.width || 118}" height="44" x="${node.x - ((node.width || 118) / 2)}" y="${node.y - 22}">
        <div xmlns="http://www.w3.org/1999/xhtml" class="${getNodeClass(node.variant)}" data-trees-node-id="${escapeHtml(String(node.id))}" title="${escapeHtml(node.path)}">${escapeHtml(node.label)}</div>
      </foreignObject>
    `).join('');

    const emptyMarkup = safeModel.isEmpty ? `
      <div class="trees-module__empty">
        <div class="trees-module__empty-card">
          <span class="trees-module__empty-label">Awaiting Input</span>
          <h3 class="trees-module__empty-title">${escapeHtml(safeModel.emptyStateTitle)}</h3>
          <p class="trees-module__empty-copy">${escapeHtml(safeModel.emptyStateCopy)}</p>
        </div>
      </div>
    ` : '';

    return `
      <section class="${sectionClass}" data-trees-module-root>
        <header class="trees-module__header">
          <div class="trees-module__title-wrap">
            <span class="material-symbols-outlined" aria-hidden="true">account_tree</span>
          <h2 class="trees-module__title">${escapeHtml(safeModel.title)}</h2>
          <span class="trees-module__badge">${escapeHtml(safeModel.badge)}</span>
        </div>
        <span class="trees-module__eyebrow">${escapeHtml(safeModel.eyebrow)}</span>
        </header>
        <div class="trees-module__body">
          <section class="trees-module__canvas">
            <svg class="trees-module__svg" viewBox="0 0 ${safeModel.canvasWidth || 1000} ${safeModel.canvasHeight}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              ${edgeMarkup}
              ${nodeMarkup}
            </svg>
            ${emptyMarkup}
            <div class="trees-module__node-modal-backdrop" data-trees-node-modal-backdrop>
              <section class="trees-module__node-modal" role="dialog" aria-modal="true" aria-hidden="true" data-trees-node-modal>
                <header class="trees-module__node-modal-head">
                  <h3 class="trees-module__node-modal-title" data-trees-node-modal-title>VNode Detail</h3>
                  <button class="trees-module__node-modal-close" data-trees-node-modal-close type="button">Close</button>
                </header>
                <div class="trees-module__node-modal-meta" data-trees-node-modal-body></div>
              </section>
            </div>
          </section>
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

    const currentRoot = container.querySelector('[data-trees-module-root]');
    if (currentRoot && currentRoot.__treesCleanup) {
      currentRoot.__treesCleanup();
      currentRoot.__treesCleanup = null;
    }

    const model = Array.isArray(inputOrOptions.nodes)
      ? inputOrOptions
      : createModel({ ...inputOrOptions, __container: container });
    ensureStyles();
    container.innerHTML = renderToString(model);
    const root = container.querySelector('[data-trees-module-root]');
    if (!root) {
      return null;
    }
    bindTreeNodeModal(root, Array.isArray(model.nodes) ? model.nodes : []);
    return root;
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
