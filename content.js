(() => {
  'use strict';
  const HOST_ID = 'gpt-question-map-root';
  if (document.getElementById(HOST_ID)) return;

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = 'all:initial;position:fixed;right:12px;top:50%;transform:translateY(-50%);z-index:2147483600;display:block;color-scheme:light dark;';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host { --bg:#fff; --fg:#24332e; --muted:#77847e; --line:#e8eeeb; --soft:#f4f7f5; --accent:#148568; --tint:#e7f4ee; font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif; }
      * { box-sizing:border-box; } [hidden] { display:none !important; }
      button,input { font:inherit; } button { cursor:pointer; color:inherit; } button:focus-visible,input:focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
      .dock { display:flex; align-items:center; gap:8px; color:var(--fg); }
      .rail { width:30px; padding:8px 3px; display:flex; align-items:center; flex-direction:column; gap:4px; background:var(--bg); border:1px solid var(--line); border-radius:18px; box-shadow:0 3px 16px #0000000c; }
      .launch { border:0; background:transparent; width:24px; height:28px; display:grid; place-items:center; padding:3px; color:var(--accent); border-radius:7px; }
      .launch:hover { background:var(--tint); }
      .marks { display:flex; flex-direction:column; align-items:center; max-height:48vh; gap:0; overflow:hidden; width:24px; }
      .mark { border:0; background:transparent; width:24px; height:12px; min-height:5px; flex:1 1 12px; padding:0; display:flex; align-items:center; justify-content:center; }
      .mark::after { content:""; display:block; height:3px; width:10px; border-radius:4px; background:#b8c6bf; transition:width .15s,background .15s; }
      .mark:hover::after { width:19px; background:var(--accent); }
      .mark[aria-current="true"]::after { width:20px; background:var(--accent); }
      .total { font-size:10px; color:var(--muted); line-height:20px; font-variant-numeric:tabular-nums; }
      .panel { width:310px; max-width:calc(100vw - 72px); background:var(--bg); border:1px solid var(--line); border-radius:18px; box-shadow:0 12px 56px #0000001a; overflow:hidden; }
      header { padding:18px 17px 12px; display:flex; align-items:center; justify-content:space-between; gap:8px; }
      .eyebrow { color:var(--accent); font-size:10px; letter-spacing:1.6px; font-weight:700; }
      h2 { font-size:17px; line-height:1.4; margin:3px 0 0; font-weight:650; }
      .tools { display:flex; gap:3px; }
      .icon { width:28px; height:28px; border:0; border-radius:8px; background:transparent; color:var(--muted); display:grid; place-items:center; padding:5px; }
      .icon:hover,.icon[aria-pressed="true"] { color:var(--accent); background:var(--tint); }
      .search-wrap { padding:0 14px 12px; }
      .search { display:flex; align-items:center; gap:7px; background:var(--soft); border:1px solid var(--line); border-radius:10px; padding:8px 10px; color:var(--muted); }
      input { min-width:0; width:100%; border:0; outline:none; background:transparent; color:var(--fg); font-size:12px; }
      input::placeholder { color:var(--muted); }
      .list { max-height:min(60vh,620px); min-height:70px; overflow:auto; overscroll-behavior:contain; padding:0 8px 9px; scrollbar-width:thin; scrollbar-color:#bdcdc4 transparent; }
      .history-tools { padding:0 14px 10px; } .load-history { width:100%; border:1px solid var(--line); background:var(--soft); border-radius:8px; padding:7px; font-size:11px; }
      .item[data-cached="true"] .num::after { content:"·"; color:var(--accent); }
      .item { width:100%; display:flex; align-items:flex-start; gap:10px; border:0; text-align:left; background:transparent; border-radius:10px; padding:10px 9px; margin:2px 0; }
      .item:hover { background:var(--soft); }
      .item[aria-current="true"] { background:var(--tint); color:var(--accent); }
      .num { font-size:11px; line-height:22px; color:var(--muted); width:23px; flex-shrink:0; font-variant-numeric:tabular-nums; }
      .item[aria-current="true"] .num { color:var(--accent); }
      .label { font-size:12px; line-height:22px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow-wrap:anywhere; white-space:pre-line; }
      mark { background:#f8e7a0; color:#47380a; border-radius:2px; }
      .empty { padding:22px 16px; text-align:center; color:var(--muted); font-size:12px; }
      footer { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-top:1px solid var(--line); color:var(--muted); font-size:11px; }
      .arrows { display:flex; gap:3px; } .icon:disabled { opacity:.3; cursor:default; }
      .hint { color:var(--muted); font-size:10px; padding:0 14px 12px; }
      svg { width:17px; height:17px; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
      @media (prefers-color-scheme:dark) { :host { --bg:#252a28; --fg:#e1e8e3; --muted:#9aa89f; --line:#37403a; --soft:#2e3530; --accent:#71d3b1; --tint:#243f34; } }
      :host([data-theme="dark"]) { --bg:#252a28; --fg:#e1e8e3; --muted:#9aa89f; --line:#37403a; --soft:#2e3530; --accent:#71d3b1; --tint:#243f34; }
      :host([data-theme="light"]) { --bg:#fff; --fg:#24332e; --muted:#77847e; --line:#e8eeeb; --soft:#f4f7f5; --accent:#148568; --tint:#e7f4ee; }
      @media (max-width:600px) { .panel { width:280px; } .marks { max-height:34vh; } }
      @media (prefers-reduced-motion:reduce) { * { transition:none !important; } }
    </style>
    <div class="dock">
      <section class="panel" id="panel" aria-label="当前对话提问目录" hidden>
        <header><div><div class="eyebrow">QUESTION MAP</div><h2>提问地图</h2></div><div class="tools">
          <button class="icon" id="rescan" title="重新扫描当前对话" aria-label="重新扫描当前对话"><svg viewBox="0 0 24 24"><path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/></svg></button>
          <button class="icon" id="pin" title="固定目录" aria-label="固定目录" aria-pressed="false"><svg viewBox="0 0 24 24"><path d="m16 3 5 5-4 2-3 5-2-2-6 6-1-1 6-6-2-2 5-3z"/></svg></button>
          <button class="icon" id="close" title="收起目录" aria-label="收起目录"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        </div></header>
        <div class="search-wrap"><label class="search"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg><input id="search" type="search" placeholder="搜索这段对话中的问题…" aria-label="搜索问题" autocomplete="off"></label></div>
        <div class="history-tools"><button id="load-history" class="load-history">收录更早提问</button></div>
        <nav class="list" id="list" aria-label="问题列表"></nav>
        <footer><span id="status" role="status" aria-live="polite">等待对话</span><div class="arrows"><button class="icon" id="prev" title="上一个问题" aria-label="上一个问题"><svg viewBox="0 0 24 24"><path d="m6 14 6-6 6 6"/></svg></button><button class="icon" id="next" title="下一个问题" aria-label="下一个问题"><svg viewBox="0 0 24 24"><path d="m6 10 6 6 6-6"/></svg></button></div></footer>
        <div class="hint">目录可上下滚动 · 本次打开期间保留已发现提问</div>
      </section>
      <div class="rail"><button id="launch" class="launch" aria-label="展开提问地图" aria-expanded="false" aria-controls="panel" title="提问地图 · Alt + Shift + M"><svg viewBox="0 0 24 24"><path d="M8 5h13M8 12h13M8 19h13"/><circle cx="3" cy="5" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="19" r="1"/></svg></button><div class="marks" id="marks" role="group" aria-label="提问地图刻度"></div><span class="total" id="total">0</span></div>
    </div>`;
  document.documentElement.appendChild(host);
  const $ = id => shadow.getElementById(id);
  const state = { entries: [], active: -1, enabled: true, pinned: false, open: false, url: location.href };
  const histories = new Map();
  let historyKey = location.pathname;
  let history = new QuestionMapHistory();
  histories.set(historyKey, history);
  let lastLive = [], routeOldLive = null, direction = 1, lastScrollTop = 0;
  let scanToken = 0, scanning = false, restoreScan = true, jumpToken = 0, notice = '', lastScroller = null;
  let rebuildTimer, closeTimer, scrollFrame, highlightTimer, highlighted;
  let visibleEntries = [];

  function persist(values) {
    try { chrome.storage.local.set(values).catch(() => {}); } catch { /* Extension reloaded. */ }
  }
  function setOpen(open, focus = false) {
    state.open = open;
    $('panel').hidden = !open;
    $('launch').setAttribute('aria-expanded', String(open));
    $('launch').setAttribute('aria-label', open ? '收起提问地图' : '展开提问地图');
    if (focus && open) $('search').focus();
    if (open) revealCurrent();
  }
  function setPinned(pinned) {
    state.pinned = pinned;
    $('pin').setAttribute('aria-pressed', String(pinned));
    persist({ mapPinned: pinned });
  }
  function syncTheme() {
    const root = document.documentElement;
    const value = root.getAttribute('data-theme');
    host.dataset.theme = root.classList.contains('dark') || value === 'dark' ? 'dark'
      : root.classList.contains('light') || value === 'light' ? 'light' : '';
  }
  const themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
  syncTheme();

  function messageText(el) {
    const copy = el.cloneNode(true);
    copy.querySelectorAll('button,svg,script,style,[aria-hidden="true"],h5.sr-only,h6.sr-only').forEach(node => node.remove());
    let text = (copy.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      const image = el.querySelector('img');
      text = image ? (image.alt || '图片提问') : '附件或非文字提问';
    }
    return text;
  }
  function layoutTarget(node) {
    if (!node?.isConnected || node.closest('[hidden],[aria-hidden="true"],template')) return null;
    const hasBox = element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden';
    };
    if (hasBox(node)) return node;
    // display:contents has no box of its own; its visible children still hold the question.
    for (const child of node.querySelectorAll('*')) {
      if (!child.closest('[hidden],[aria-hidden="true"],button,svg') && hasBox(child)) return child;
    }
    if (getComputedStyle(node).display === 'contents') {
      const turn = node.closest('[data-testid^="conversation-turn-"],article,[data-turn]');
      if (turn && hasBox(turn)) return turn;
    }
    return null;
  }
  function collect() {
    const bubbleSelector = '[data-user-message-bubble="true"]';
    const roleSelector = `${bubbleSelector},[data-message-author-role="user"],[data-testid="user-message"],[data-turn="user"]`;
    const nodes = new Set(document.querySelectorAll(roleSelector));
    // Semantic speaker headings also cover layouts without data-message-author-role.
    for (const turn of document.querySelectorAll('article,[data-testid^="conversation-turn-"]')) {
      if (turn.matches('[data-turn="assistant"]') || turn.querySelector('[data-message-author-role="assistant"]')) continue;
      const heading = turn.querySelector('h5.sr-only,h6.sr-only,[role="heading"].sr-only');
      if (heading && /^(you said|your message|你说|您说|你說|您說|用户)\s*[:：]?$/i.test(heading.textContent.trim())) nodes.add(turn);
    }
    const ordered = [...nodes].sort((a, b) => a === b ? 0 : a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    const seen = new Set();
    return ordered.map(node => {
      // Prefer the actual question bubble over surrounding turn metadata/actions.
      return node.matches(bubbleSelector) ? node : node.querySelector(bubbleSelector)
        || node.querySelector('[data-message-author-role="user"],[data-testid="user-message"]') || node;
    }).filter(node => {
      if (!layoutTarget(node)) return false;
      if (seen.has(node)) return false;
      seen.add(node);
      return true;
    }).map((node, index) => {
      const target = layoutTarget(node);
      const scroller = scrollParent(target);
      lastScroller = scroller;
      const base = scroller === document.scrollingElement ? 0 : scroller.getBoundingClientRect().top;
      const position = scroller.scrollTop + target.getBoundingClientRect().top - base;
      const identity = node.closest('[data-message-id],[data-turn-id],[data-testid^="conversation-turn-"]');
      const key = identity ? `${identity.hasAttribute('data-message-id') ? 'message:' + identity.getAttribute('data-message-id') : identity.hasAttribute('data-turn-id') ? 'turn:' + identity.getAttribute('data-turn-id') : identity.getAttribute('data-testid')}` : null;
      return { node, index, key, text:messageText(node), position };
    });
  }
  function syncRoute() {
    state.url = location.href;
    if (location.pathname === historyKey) return;
    if (historyKey === '/' && /^\/c\//.test(location.pathname) && !histories.has(location.pathname)) {
      histories.delete(historyKey); historyKey = location.pathname; histories.set(historyKey, history); return;
    }
    scanToken++; jumpToken++; scanning = false;
    $('load-history').textContent = '收录更早提问';
    routeOldLive = lastLive;
    history.detach();
    historyKey = location.pathname;
    if (!histories.has(historyKey)) histories.set(historyKey, new QuestionMapHistory());
    history = histories.get(historyKey);
    state.entries = history.entries;
    state.active = -1; notice = ''; lastScrollTop = 0;
    $('search').value = '';
    renderList(); renderMarks();
  }
  function scheduleRebuild() {
    if (!rebuildTimer) rebuildTimer = setTimeout(() => { rebuildTimer = null; rebuild(); }, 220);
  }
  function rebuild() {
    if (!state.enabled) return;
    syncRoute();
    if (!host.isConnected) document.documentElement.appendChild(host);
    const next = collect();
    // During SPA navigation the old conversation can remain visible until hydration.
    if (routeOldLive && next.length && next.length === routeOldLive.length && next.every((e, i) => e.node === routeOldLive[i].node && e.text === routeOldLive[i].text)) return;
    routeOldLive = null;
    lastLive = next.map(e => ({ ...e }));
    const changed = history.merge(next, direction);
    state.entries = history.entries;
    if (changed) {
      renderList();
      renderMarks();
    }
    updateActive();
    updateStatus();
  }
  function renderMarks() {
    const fragment = document.createDocumentFragment();
    const count = Math.min(state.entries.length, 36);
    for (let i = 0; i < count; i++) {
      const index = count <= 1 ? 0 : Math.round(i * (state.entries.length - 1) / (count - 1));
      const entry = state.entries[index];
      const button = document.createElement('button');
      button.className = 'mark';
      button.dataset.index = String(index);
      button.title = `${index + 1}. ${entry.text.slice(0, 180)}`;
      button.setAttribute('aria-label', button.title);
      button.addEventListener('click', () => jump(index));
      fragment.append(button);
    }
    $('marks').replaceChildren(fragment);
    $('total').textContent = String(state.entries.length);
  }
  function renderList() {
    const query = $('search').value.trim().toLocaleLowerCase();
    visibleEntries = state.entries.filter(entry => entry.text.toLocaleLowerCase().includes(query));
    const fragment = document.createDocumentFragment();
    for (const entry of visibleEntries) {
      const button = document.createElement('button');
      button.className = 'item';
      button.dataset.index = String(entry.index);
      button.title = entry.text;
      if (!layoutTarget(entry.node)) { button.dataset.cached = 'true'; button.title += '\n已收录的历史提问，点击尝试加载定位'; }
      const number = document.createElement('span');
      number.className = 'num';
      number.textContent = String(entry.index + 1).padStart(2, '0');
      const label = document.createElement('span');
      label.className = 'label';
      // Keep all user text inert; never insert chat content as HTML.
      label.textContent = entry.text;
      button.append(number, label);
      button.addEventListener('click', () => jump(entry.index));
      fragment.append(button);
    }
    if (!visibleEntries.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = state.entries.length ? '没有匹配的问题，试试其他关键词。' : '还没有发现已加载的提问。可点击右上角重新扫描；仍为空时，在扩展菜单查看诊断信息。';
      fragment.append(empty);
    }
    $('list').replaceChildren(fragment);
    paintActive();
    updateStatus();
  }
  function updateStatus() {
    const count = state.entries.length;
    $('status').textContent = notice || ($('search').value.trim()
      ? `匹配 ${visibleEntries.length} / ${count} 个问题`
      : count ? `已收录 ${count} 个提问` : '当前页面暂无提问');
    const indices = visibleEntries.map(entry => entry.index);
    $('prev').disabled = !indices.some(index => index < state.active);
    $('next').disabled = !indices.some(index => index > state.active);
  }
  function paintActive() {
    const marks = [...$('marks').querySelectorAll('[data-index]')];
    const nearest = marks.reduce((best, item) => !best || Math.abs(Number(item.dataset.index) - state.active) < Math.abs(Number(best.dataset.index) - state.active) ? item : best, null);
    shadow.querySelectorAll('[data-index]').forEach(button => {
      if (state.active >= 0 && (button.classList.contains('mark') ? button === nearest : Number(button.dataset.index) === state.active)) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  }
  function revealCurrent() {
    const item = $('list').querySelector('[aria-current="true"]');
    if (!item) return;
    // Only move the menu's own scroll position, never its page ancestors.
    const listRect = $('list').getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    if (rect.top < listRect.top || rect.bottom > listRect.bottom) $('list').scrollTop += rect.top - listRect.top - listRect.height / 2 + rect.height / 2;
  }
  function updateActive() {
    if (!state.entries.length) {
      state.active = -1;
      paintActive();
      updateStatus();
      return;
    }
    const first = state.entries.find(entry => layoutTarget(entry.node));
    let top = 100;
    if (first) {
      const scroller = scrollParent(layoutTarget(first.node) || first.node);
      if (scroller !== document.scrollingElement) top = Math.max(0, scroller.getBoundingClientRect().top) + 100;
    }
    let active = first?.index ?? state.active;
    for (const entry of state.entries) {
      const target = layoutTarget(entry.node);
      if (!target) continue;
      if (target.getBoundingClientRect().top <= top) active = entry.index;
      else break;
    }
    if (active !== state.active) {
      state.active = active;
      paintActive();
      updateStatus();
      if (state.open && !shadow.activeElement) revealCurrent();
    }
  }
  function scrollParent(node) {
    for (let parent = node.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (/(auto|scroll|overlay|hidden)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight + 4) return parent;
    }
    return document.scrollingElement || document.documentElement;
  }
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  function currentScroller() {
    const target = state.entries.map(e => layoutTarget(e.node)).find(Boolean);
    if (target) return scrollParent(target);
    if (lastScroller?.isConnected) return lastScroller;
    const main = document.querySelector('main,[role="main"]');
    if (main && /(auto|scroll|hidden)/.test(getComputedStyle(main).overflowY) && main.scrollHeight > main.clientHeight) return main;
    return main ? scrollParent(main) : document.scrollingElement;
  }
  async function jump(index) {
    const entry = state.entries[index];
    if (!entry) return;
    if (scanning) { restoreScan = false; scanToken++; }
    const token = ++jumpToken;
    notice = '';
    let target = layoutTarget(entry.node);
    if (!target) {
      const key = historyKey;
      const scroller = currentScroller();
      notice = '正在加载这条历史提问…'; updateStatus();
      scroller.scrollTo({ top:Math.max(0, entry.position - 88), behavior:'instant' });
      for (let attempt = 0; attempt < 16 && token === jumpToken && key === historyKey; attempt++) {
        await pause(150); rebuild(); target = layoutTarget(entry.node); if (target) break;
      }
      if (token !== jumpToken || key !== historyKey) return;
      notice = '';
      if (!target) { notice = '提问已保留，网页尚未加载该位置，请向上滚动加载'; updateStatus(); return; }
    }
    // Let the browser reveal all nested scroll containers first, including clipped ancestors.
    target.scrollIntoView({ block:'center', inline:'nearest', behavior:'instant' });
    const scroller = scrollParent(target);
    const rect = target.getBoundingClientRect();
    const base = scroller === document.scrollingElement ? 0 : scroller.getBoundingClientRect().top;
    scroller.scrollTo({ top: Math.max(0, scroller.scrollTop + rect.top - base - 88), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    state.active = index;
    paintActive();
    updateStatus();
    clearTimeout(highlightTimer);
    if (highlighted) highlighted.cancel();
    // Web Animations changes no persistent inline styles on ChatGPT messages.
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && target.animate) {
      highlighted = target.animate([{ outline:'2px solid #20a582', outlineOffset:'8px' }, { outline:'2px solid transparent', outlineOffset:'8px' }], { duration:1400, easing:'ease-out' });
      highlightTimer = setTimeout(() => { highlighted = null; }, 1500);
    }
  }
  function adjacent(direction) {
    const candidates = visibleEntries.filter(entry => direction < 0 ? entry.index < state.active : entry.index > state.active);
    const target = direction < 0 ? candidates.at(-1) : candidates[0];
    if (target) jump(target.index);
  }
  $('search').addEventListener('input', renderList);
  $('search').addEventListener('keydown', event => {
    if (event.key === 'Enter' && visibleEntries[0]) { event.preventDefault(); jump(visibleEntries[0].index); }
    if (event.key === 'ArrowDown') { event.preventDefault(); $('list').querySelector('button')?.focus(); }
  });
  $('list').addEventListener('keydown', event => {
    const items = [...$('list').querySelectorAll('button')];
    const index = items.indexOf(shadow.activeElement);
    const next = event.key === 'ArrowDown' ? index + 1 : event.key === 'ArrowUp' ? index - 1 : -1;
    if (next >= 0 && next < items.length) { event.preventDefault(); items[next].focus(); }
  });
  $('prev').addEventListener('click', () => adjacent(-1));
  $('next').addEventListener('click', () => adjacent(1));
  $('load-history').addEventListener('click', async () => {
    if (scanning) { scanToken++; $('load-history').textContent = '正在停止…'; return; }
    rebuild();
    const scroller = currentScroller();
    const startTop = scroller.scrollTop;
    const key = historyKey;
    const token = ++scanToken;
    let idle = 0, previous = '', exhausted = false;
    scanning = true; restoreScan = true; notice = '';
    $('load-history').textContent = '正在收录…点击停止';
    try {
      // Continue a later scan from the earliest recorded position, even after restoring the viewport.
      const earliest = history.entries.reduce((top, e) => Math.min(top, e.position - 88), startTop);
      direction = -1;
      scroller.scrollTo({ top:Math.max(0, earliest), behavior:'instant' });
      await pause(350);
      if (token !== scanToken || key !== location.pathname) return;
      rebuild();
      for (let step = 0; step < 160 && token === scanToken && key === historyKey && state.enabled; step++) {
        direction = -1;
        scroller.scrollTo({ top:Math.max(0, scroller.scrollTop - Math.max(200, scroller.clientHeight * .8)), behavior:'instant' });
        await pause(350);
        if (key !== location.pathname) break;
        rebuild();
        const fingerprint = `${history.entries.length}:${lastLive[0]?.text || ''}:${Math.round(scroller.scrollTop)}`;
        idle = fingerprint === previous ? idle + 1 : 0; previous = fingerprint;
        if (scroller.scrollTop <= 2 && idle >= 8) { exhausted = true; break; }
      }
    } finally {
      if (restoreScan && key === historyKey && key === location.pathname) {
        scroller.scrollTo({ top:startTop, behavior:'instant' });
        notice = exhausted ? `已收录 ${history.entries.length} 个提问，已到网页顶部` : `已收录 ${history.entries.length} 个提问，可继续收录`;
        updateStatus();
      }
      if (token === scanToken || key === historyKey) { scanning = false; $('load-history').textContent = '收录更早提问'; }
    }
  });
  $('rescan').addEventListener('click', () => { $('search').value = ''; rebuild(); renderList(); });
  $('pin').addEventListener('click', () => setPinned(!state.pinned));
  function close() { setPinned(false); setOpen(false); $('launch').focus(); }
  $('close').addEventListener('click', close);
  $('launch').addEventListener('click', () => {
    // Hover opens a preview; the first click pins it for searching.
    const open = !state.pinned;
    setPinned(open);
    setOpen(open, open);
  });
  shadow.querySelector('.dock').addEventListener('mouseenter', () => { clearTimeout(closeTimer); setOpen(true); });
  shadow.querySelector('.dock').addEventListener('mouseleave', () => {
    closeTimer = setTimeout(() => { if (!state.pinned && !shadow.activeElement) setOpen(false); }, 350);
  });
  shadow.addEventListener('focusout', () => {
    setTimeout(() => { if (!state.pinned && !shadow.activeElement && !host.matches(':hover')) setOpen(false); }, 0);
  });
  document.addEventListener('keydown', event => {
    if (!state.enabled) return;
    if (event.altKey && event.shiftKey && event.code === 'KeyM') {
      event.preventDefault();
      if (state.open && state.pinned) close();
      else { setPinned(true); setOpen(true, true); }
    } else if (event.key === 'Escape' && state.open && (shadow.activeElement || host.matches(':hover'))) close();
  });
  document.addEventListener('scroll', event => {
    if (!state.enabled || event.composedPath().includes(host) || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = null;
      const scroller = currentScroller();
      direction = scroller.scrollTop < lastScrollTop ? -1 : 1;
      lastScrollTop = scroller.scrollTop;
      updateActive();
    });
  }, { capture:true, passive:true });
  window.addEventListener('resize', scheduleRebuild, { passive:true });

  const observer = new MutationObserver(records => {
    if (!state.enabled) return;
    const relevant = records.some(record => {
      const element = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      if (element === host || host.contains(element)) return false;
      if (element?.closest('[data-message-author-role="assistant"]')) return false;
      return true;
    });
    if (relevant) scheduleRebuild();
  });
  observer.observe(document.documentElement, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['data-user-message-bubble', 'data-message-author-role', 'data-turn', 'data-testid', 'hidden', 'aria-hidden', 'class', 'style'] });
  // SPA navigation can reuse existing nodes without a traditional page load.
  setInterval(() => {
    if (location.href !== state.url) {
      syncRoute();
      scheduleRebuild();
    }
  }, 800);
  function applySettings(settings) {
    if (typeof settings.mapEnabled === 'boolean') state.enabled = settings.mapEnabled;
    if (typeof settings.mapPinned === 'boolean') {
      state.pinned = settings.mapPinned;
      $('pin').setAttribute('aria-pressed', String(state.pinned));
      setOpen(state.pinned);
    }
    host.style.display = state.enabled ? 'block' : 'none';
    if (state.enabled) scheduleRebuild();
  }
  try {
    chrome.storage.local.get(['mapEnabled', 'mapPinned']).then(applySettings).catch(() => {});
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      applySettings(Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue])));
    });
    chrome.runtime.onMessage.addListener((message, sender, respond) => {
      if (message.type === 'question-map-toggle') {
        state.enabled = true;
        host.style.display = 'block';
        persist({ mapEnabled:true });
        setPinned(!state.pinned);
        setOpen(state.pinned, state.pinned);
        rebuild();
        respond({ ok:true });
      } else if (message.type === 'question-map-status') { rebuild(); respond({ ok:true, count:state.entries.length, loaded:state.entries.filter(e => layoutTarget(e.node)).length }); }
      else if (message.type === 'question-map-diagnostics') {
        rebuild();
        respond({
          version:'1.1.0', domain:location.hostname, enabled:state.enabled,
          identified:state.entries.length,
          loaded:state.entries.filter(e => layoutTarget(e.node)).length,
          bubbleMarkers:document.querySelectorAll('[data-user-message-bubble="true"]').length,
          roleMarkers:document.querySelectorAll('[data-message-author-role="user"]').length,
          turnMarkers:document.querySelectorAll('[data-turn="user"]').length,
          messageMarkers:document.querySelectorAll('[data-testid="user-message"]').length,
          conversationTurns:document.querySelectorAll('[data-testid^="conversation-turn-"]').length,
          articles:document.querySelectorAll('article').length,
          speakerHeadings:document.querySelectorAll('h5.sr-only,h6.sr-only,[role="heading"].sr-only').length
        });
      }
    });
  } catch { /* Allows the same script to run in the offline preview. */ }
  rebuild();
})();
