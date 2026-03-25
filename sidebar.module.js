/**
 * ============================================================================
 * !!! SIDEBAR MODULE USAGE GUIDE / AGENT.md !!!
 * ============================================================================
 *
 * 이 파일은 `console-sidebar` <aside> 전체를 독립형 패키지로 제공한다.
 * 목적은 "다른 index.html에도 최소 수정으로 붙는 Sidebar"를 만드는 것이다.
 *
 * ----------------------------------------------------------------------------
 * !!! 가장 중요한 점 !!!
 * ----------------------------------------------------------------------------
 * `sidebar.module.js`는 CSS를 넣어주지만, 아래 HTML 구조를 자동으로 만들어주지는 않는다.
 * 즉, `.console-shell`, `.console-main`, `#sidebar-mount`는
 * "호스트 HTML 파일에서 직접 작성"해야 레이아웃이 제대로 붙는다.
 *
 * 권장 HTML 구조:
 *
 * <div class="console-shell">
 *   <div id="sidebar-mount"></div>
 *
 *   <main class="console-main">
 *     <!-- 기존 페이지 본문 -->
 *   </main>
 * </div>
 *
 * <script src="./sidebar.module.js"></script>
 * <script>
 *   window.SidebarModule.mount({
 *     mountSelector: '#sidebar-mount',
 *     versionText: 'example'
 *   });
 * </script>
 *
 * 요약:
 * - `console-shell`  : 호스트 HTML이 직접 만든다.
 * - `console-main`   : 호스트 HTML이 직접 만든다.
 * - `#sidebar-mount` : 호스트 HTML이 직접 만든다.
 * - `console-sidebar`: 이 모듈이 mount 시 생성한다.
 *
 * ----------------------------------------------------------------------------
 * Public API
 * ----------------------------------------------------------------------------
 * - `window.SidebarModule.createModel(options)`
 * - `window.SidebarModule.renderToString(optionsOrModel)`
 * - `window.SidebarModule.mount(options)`
 * - `window.SidebarModule.getMarkup(options)`
 * - `window.SidebarModule.ensureSidebarStyles()`
 * - `window.SidebarModule.autoMount(options)`
 *
 * ----------------------------------------------------------------------------
 * Recommended Integration
 * ----------------------------------------------------------------------------
 * 1. 가장 안전한 방식
 *    - HTML에 `<div id="sidebar-mount"></div>`를 만든다.
 *    - 가능하면 본문은 `<main class="console-main">...</main>`으로 감싼다.
 *    - 전체는 `<div class="console-shell">...</div>`로 감싼다.
 *    - `<script src="./sidebar.module.js"></script>`를 로드한다.
 *    - `SidebarModule.mount({ mountSelector: '#sidebar-mount' })`를 호출한다.
 *
 * 2. 빠른 실험용 방식
 *    - 이 파일만 로드해도, 명시적 mount 호출이 없고 `.console-sidebar`가 아직 없으면
 *      DOMContentLoaded 시점에 body에 standalone mount 지점을 생성해 Sidebar를 자동 표시한다.
 *    - 이 경우 Sidebar 자체는 보이지만, "왼쪽 Sidebar + 오른쪽 본문" 레이아웃은 자동 보장되지 않는다.
 *
 * ----------------------------------------------------------------------------
 * Important Cautions
 * ----------------------------------------------------------------------------
 * - 이 파일은 Sidebar 마크업/스타일/자동 마운트만 담당한다.
 * - Sidebar 버튼을 눌렀을 때 본문을 바꾸는 로직은 호스트 페이지 책임이다.
 * - React/Vue 같은 VDOM 환경에서는 `mount()`보다 `createModel()` + `renderToString()` 또는
 *   동일 모델을 JSX로 직접 매핑하는 방식을 우선한다.
 * - 이미 `.console-sidebar`가 존재하는 문서에서 또 자동 마운트되면 중복될 수 있으므로,
 *   이 파일은 자동 마운트 전에 기존 Sidebar와 명시적 mount 여부를 모두 확인한다.
 * - 호스트 페이지가 `.console-shell`, `.console-main`을 쓰면 기존 레이아웃과 자연스럽게 붙고,
 *   그렇지 않더라도 standalone 모드로 Sidebar 자체는 보이도록 설계했다.
 *
 * ----------------------------------------------------------------------------
 * Editing Rules For Other Agents
 * ----------------------------------------------------------------------------
 * - 새 메뉴 추가는 `DEFAULT_VIEWS`만 수정하는 쪽을 우선한다.
 * - 호스트 연동 포인트를 늘릴 때는 `window.SidebarModule`에만 공개 API를 추가한다.
 * - 자동 마운트 규칙을 바꿀 때는 "기존 수동 mount 페이지와 충돌하지 않는가"를 먼저 확인한다.
 * ============================================================================
 */
(() => {
  const SIDEBAR_STYLE_ID = 'sidebar-module-styles';
  const SIDEBAR_FONT_ID = 'sidebar-module-font';
  const SIDEBAR_AUTO_HOST_ID = 'sidebar-auto-mount';
  const DEFAULT_VIEWS = [
    { key: 'Workspace', icon: 'grid_view', label: 'Workspace', active: true },
    { key: 'Trees', icon: 'account_tree', label: 'Trees' },
    { key: 'Snapshots', icon: 'history', label: 'Snapshots' },
    { key: 'Analytics', icon: 'insights', label: 'Analytics' },
    { key: 'Deploy', icon: 'rocket_launch', label: 'Deploy' }
  ];
  let hasExplicitMount = false;

  // HTML 속성에 들어갈 텍스트를 안전하게 정리하는 함수입니다.
  // Sidebar 라벨은 여러 HTML에서 재사용될 수 있으므로, 문자열이 그대로 들어가 마크업을 깨뜨리지 않게 보호합니다.
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Material Symbols 폰트 링크를 한 번만 추가하는 함수입니다.
  // Sidebar 아이콘은 시각 구분이 빠르기 때문에 유지하되, 페이지마다 link가 중복되지 않게 id로 관리합니다.
  function ensureMaterialSymbols() {
    if (document.getElementById(SIDEBAR_FONT_ID)) {
      return;
    }

    const link = document.createElement('link');
    link.id = SIDEBAR_FONT_ID;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap';
    document.head.appendChild(link);
  }

  // Sidebar와 standalone 표시 상태에 필요한 최소 스타일만 문서에 주입하는 함수입니다.
  // 이 파일 하나만 넣어도 보이게 하려면 호스트 CSS에 기대지 않는 기본값이 필요해서, 핵심 스타일을 모듈이 직접 책임집니다.
  function ensureSidebarStyles() {
    if (document.getElementById(SIDEBAR_STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = SIDEBAR_STYLE_ID;
    style.textContent = `
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        line-height: 1;
        user-select: none;
      }

      .console-shell {
        display: grid;
        grid-template-columns: 240px minmax(0, 1fr);
        gap: 16px;
        align-items: start;
      }

      .console-main { min-width: 0; }

      .console-sidebar {
        position: sticky;
        top: 14px;
        margin-top: 14px;
        min-height: calc(100vh - 28px);
        padding: 18px 14px 14px;
        border: 1px solid var(--border, #1e2d45);
        border-radius: 12px;
        background:
          linear-gradient(180deg, rgba(17, 24, 39, 0.96), rgba(8, 11, 20, 0.94)),
          radial-gradient(circle at top, rgba(79, 195, 247, 0.08), transparent 42%);
        box-shadow: 0 18px 60px rgba(0, 0, 0, 0.28);
        backdrop-filter: blur(14px);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .console-sidebar__eyebrow {
        font-size: 10px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--text-secondary, #8898b4);
      }

      .console-sidebar__version {
        margin-top: 4px;
        color: var(--blue, #4fc3f7);
        font-size: 11px;
      }

      .console-sidebar__nav {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 8px;
      }

      .console-sidebar__button,
      .console-sidebar__button {
        width: 100%;
        border: 1px solid transparent;
        border-radius: 10px;
        background: transparent;
        color: var(--text-secondary, #8898b4);
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 12px;
        font-family: var(--font-mono, 'JetBrains Mono', monospace);
        font-size: 12px;
        cursor: pointer;
        transition: all var(--transition, 0.18s ease);
        text-align: left;
      }

      .console-sidebar__button:hover,
      .console-sidebar__button:hover {
        background: rgba(26, 34, 53, 0.82);
        border-color: var(--border, #1e2d45);
        color: var(--text-primary, #e8f0fe);
      }

      .console-sidebar__button.is-active {
        color: var(--cyan, #0ff5ce);
        background: rgba(79, 195, 247, 0.08);
        border-color: rgba(79, 195, 247, 0.22);
        box-shadow: inset 3px 0 0 var(--blue, #4fc3f7);
      }

      .console-sidebar__icon {
        flex-shrink: 0;
        font-size: 18px;
      }

      .sidebar-module-standalone {
        width: min(272px, calc(100vw - 24px));
        margin: 12px;
      }

      body.sidebar-module-standalone-body {
        margin: 0;
        min-height: 100vh;
        background: var(--bg-base, #080b14);
      }

      @media (max-width: 960px) {
        .console-shell {
          grid-template-columns: 1fr;
        }

        .console-sidebar {
          position: static;
          min-height: auto;
        }

        .console-sidebar__nav {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 680px) {
        .console-sidebar__nav {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Sidebar 내부 버튼 마크업을 만드는 함수입니다.
  // 나중에 메뉴가 추가돼도 배열만 바꾸면 되도록, 버튼 HTML을 직접 중복 작성하지 않고 반복 생성으로 묶었습니다.
  function buildNavButtons(views) {
    return views.map((view) => `
      <button class="console-sidebar__button${view.active ? ' is-active' : ''}" type="button" data-side-view="${escapeHtml(view.key)}">
        <span class="material-symbols-outlined console-sidebar__icon" aria-hidden="true">${escapeHtml(view.icon)}</span>
        <span>${escapeHtml(view.label)}</span>
      </button>
    `).join('');
  }

  // Sidebar가 소비할 순수 모델을 만드는 함수입니다.
  // DOM과 분리된 데이터 구조를 먼저 고정해 두면, 나중에 React VDOM에서는 같은 모델을 JSX로 바로 매핑할 수 있습니다.
  function createModel(options = {}) {
    return {
      title: options.title || 'Architect Console',
      versionText: options.versionText || 'sidebar-module',
      views: (options.views || DEFAULT_VIEWS).map((view, index) => ({
        key: view.key,
        icon: view.icon,
        label: view.label || view.key,
        active: typeof view.active === 'boolean' ? view.active : index === 0
      }))
    };
  }

  // Sidebar 전체 마크업 문자열을 만드는 함수입니다.
  // DOM 문자열 렌더를 별도 함수로 분리해 두면, 기존 HTML 주입 방식과 React식 렌더링 방식이 같은 모델을 공유할 수 있습니다.
  function renderToString(optionsOrModel = {}) {
    const model = Array.isArray(optionsOrModel.views) || optionsOrModel.title || optionsOrModel.versionText
      ? createModel(optionsOrModel)
      : optionsOrModel;

    return `
      <aside class="console-sidebar" aria-label="Architect Console Sidebar">
        <div>
          <p class="console-sidebar__eyebrow">${escapeHtml(model.title)}</p>
          <p class="console-sidebar__version">${escapeHtml(model.versionText)}</p>
        </div>
        <nav class="console-sidebar__nav" id="console-sidebar-nav">
          ${buildNavButtons(model.views)}
        </nav>
      </aside>
    `;
  }

  // 기존 외부 호출 호환성을 유지하기 위한 별칭 함수입니다.
  // 이미 getMarkup을 쓰는 문서가 있을 수 있어서 이름은 남겨 두고, 내부 구현은 새 renderToString으로 통일합니다.
  function getMarkup(options = {}) {
    return renderToString(options);
  }

  // mount 대상이 없을 때 standalone 호스트를 자동으로 만드는 함수입니다.
  // "스크립트만 넣어도 보이는 패키지"가 되려면 최소한의 mount 지점을 모듈이 직접 준비해야 해서, body에 안전한 기본 호스트를 생성합니다.
  function ensureStandaloneHost() {
    let host = document.getElementById(SIDEBAR_AUTO_HOST_ID);

    if (!host) {
      host = document.createElement('div');
      host.id = SIDEBAR_AUTO_HOST_ID;
      host.className = 'sidebar-module-standalone';
      document.body.prepend(host);
    }

    document.body.classList.add('sidebar-module-standalone-body');
    return host;
  }

  // 옵션에 맞는 실제 mount 지점을 찾는 함수입니다.
  // 호스트 페이지가 명시한 선택자를 우선하고, 없으면 standalone로 자연스럽게 내려가도록 해 독립성과 통합성을 같이 챙깁니다.
  function resolveMountTarget(options = {}) {
    if (typeof options.mountSelector === 'string') {
      return document.querySelector(options.mountSelector);
    }

    if (options.mountElement) {
      return options.mountElement;
    }

    const implicitTarget = document.getElementById('sidebar-mount');
    if (implicitTarget) {
      return implicitTarget;
    }

    return ensureStandaloneHost();
  }

  // 전달받은 지점에 Sidebar를 실제로 꽂는 함수입니다.
  // 수동 mount 경로는 자동 mount보다 우선해야 하므로, 명시 호출이 들어오면 플래그를 올려 이후 자동 부트스트랩을 막습니다.
  function mount(options = {}) {
    hasExplicitMount = true;
    ensureMaterialSymbols();
    ensureSidebarStyles();

    const mountTarget = resolveMountTarget(options);

    if (!mountTarget) {
      return null;
    }

    mountTarget.innerHTML = renderToString(options);
    return mountTarget.querySelector('.console-sidebar');
  }

  // 명시적 mount 호출 없이도 기본 Sidebar를 띄우는 함수입니다.
  // 빈 HTML에서 빠르게 시각 확인할 수 있어야 하므로, 기존 Sidebar가 없을 때만 최소한의 standalone mount를 수행합니다.
  function autoMount(options = {}) {
    if (hasExplicitMount || document.querySelector('.console-sidebar')) {
      return null;
    }

    ensureMaterialSymbols();
    ensureSidebarStyles();

    const target = options.mountSelector || options.mountElement || document.getElementById('sidebar-mount') || ensureStandaloneHost();
    const mountTarget = typeof target === 'string' ? document.querySelector(target) : target;

    if (!mountTarget) {
      return null;
    }

    mountTarget.innerHTML = renderToString(options);
    return mountTarget.querySelector('.console-sidebar');
  }

  // DOM 준비 이후 자동 표시를 한 번만 시도하는 부트스트랩 함수입니다.
  // 이미 호스트가 수동 mount를 예약해 둔 페이지와 충돌하지 않도록, 기존 Sidebar 존재 여부와 명시 mount 여부를 함께 검사합니다.
  function scheduleAutoMount() {
    const run = () => {
      autoMount({
        versionText: 'sidebar-module'
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
      run();
    }
  }

  window.SidebarModule = {
    createModel,
    ensureSidebarStyles,
    renderToString,
    getMarkup,
    mount,
    autoMount
  };

  scheduleAutoMount();
})();
