/* Local exact-match UI translation for Korean. No network, no HTML replacement. */
(() => {
  'use strict';
  if (globalThis.__linearKorean) return;
  globalThis.__linearKorean = true;

  const ATTRIBUTES = ['placeholder', 'aria-label', 'title', 'alt', 'data-label'];
  const SKIP = 'script,style,noscript,textarea,pre,code,svg > *,math,[contenteditable]:not([contenteditable="false"]),[translate="no"],.notranslate,.ProseMirror,[data-lexical-editor],[class*="variable_name--root"],[class*="syntax-"]';
  const EDITABLE = 'textarea,[contenteditable]:not([contenteditable="false"]),[data-lexical-editor]';
  const MONTHS = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  };
  const MONTH_NAMES = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
  const RE_MONTH_YEAR = new RegExp(`^(${MONTH_NAMES}) (\\d{4})$`);
  const RE_MONTH_DAY = new RegExp(`^(${MONTH_NAMES}) (\\d{1,2})$`);
  const RE_FULL_DATE = new RegExp(`^(${MONTH_NAMES}) (\\d{1,2}), (\\d{4})$`);
  const RE_CYCLE = /^Current cycle is (.+?) – (.+?), next cycle begins (.+)$/;
  const TIME_UNITS = {
    second: '초', minute: '분', min: '분', m: '분', hour: '시간', h: '시간',
    day: '일', d: '일', week: '주', w: '주', month: '개월', mo: '개월', year: '년', y: '년',
  };
  // [한국어 이름, 단위]
  const COUNT_NOUNS = {
    type: ['유형', '개'], 'api key': ['API 키', '개'], status: ['상태', '개'], template: ['템플릿', '개'],
    'issue template': ['이슈 템플릿', '개'], label: ['라벨', '개'], loop: ['루프', '개'], team: ['팀', '개'],
    pipeline: ['파이프라인', '개'], member: ['멤버', '명'], user: ['사용자', '명'],
  };
  const RE_COUNT = /^(\d+(?:,\d{3})*) (api keys?|issue templates?|types?|statuses|status|templates?|labels?|loops?|teams?|pipelines?|members?|users?)$/i;
  const original = new WeakMap();
  let dictionary = new Map();
  let normalized = new Map();
  let maxSourceLength = 0;
  let generation = 0;
  let scheduled = null;
  let walker = null;
  let activeRoot = null;
  const roots = new Set();

  function excluded(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!element) return true;
    if (node.nodeType === Node.ELEMENT_NODE && element.matches(EDITABLE)) {
      return !!element.parentElement?.closest(SKIP);
    }
    return !!element.closest(SKIP);
  }

  function dateText(key) {
    let m = key.match(RE_FULL_DATE);
    if (m) return `${m[3]}년 ${MONTHS[m[1]]}월 ${Number(m[2])}일`;
    m = key.match(RE_MONTH_DAY);
    if (m) return `${MONTHS[m[1]]}월 ${Number(m[2])}일`;
    m = key.match(/^(about |almost |over )?(\d+|an?) (second|minute|hour|day|week|month|year)s? ago$/);
    if (m) return `${m[1] ? '약 ' : ''}${/^an?$/.test(m[2]) ? 1 : m[2]}${TIME_UNITS[m[3]]} 전`;
    m = key.match(/^(\d+) ?(min|mo|m|h|d|w|y) ago$/);
    if (m) return `${m[1]}${TIME_UNITS[m[2]]} 전`;
    m = key.match(/^in (\d+|an?) (second|minute|hour|day|week|month|year)s?$/);
    if (m) return `${/^an?$/.test(m[1]) ? 1 : m[1]}${TIME_UNITS[m[2]]} 후`;
    return null;
  }

  function patternTranslate(key) {
    let m = key.match(RE_MONTH_YEAR);
    if (m) return `${m[2]}년 ${MONTHS[m[1]]}월`;
    const date = dateText(key);
    if (date) return date;
    m = key.match(/^(Last seen|Last used) (.+)$/);
    if (m && dictionary.has(m[1])) {
      const when = dateText(m[2]);
      if (when) return `${dictionary.get(m[1])} ${when}`;
    }
    m = key.match(RE_CYCLE);
    if (m) {
      const [from, to, next] = [dateText(m[1]), dateText(m[2]), dateText(m[3])];
      if (from && to && next) return `현재 사이클: ${from} – ${to}, 다음 사이클 시작: ${next}`;
    }
    m = key.match(/^(Every )?(\d+) (day|week|month)s?$/);
    if (m) return `${m[2]}${TIME_UNITS[m[3]]}${m[1] ? '마다' : ''}`;
    m = key.match(/^(\d+) levels?$/);
    if (m) return `${m[1]}단계`;
    m = key.match(/^(\$[\d,.]+) remaining$/);
    if (m) return `${m[1]} 남음`;
    m = key.match(/^Free for all users · (\d+) users?$/);
    if (m) return `모든 사용자 무료 · 사용자 ${m[1]}명`;
    m = key.match(/^With (\d+) users? that makes (\$[\d,.]+) per month\.$/);
    if (m) return `사용자 ${m[1]}명 기준 월 ${m[2]}입니다.`;
    m = key.match(RE_COUNT);
    if (m) {
      const noun = m[2].toLowerCase().replace(/(status)(es)?$|s$/, '$1');
      const [label, counter] = COUNT_NOUNS[noun];
      return `${label} ${m[1]}${counter}`;
    }
    m = key.match(/^(\d+(?:,\d{3})*) (issues?|projects?)$/);
    if (m) {
      const label = dictionary.get(m[2].startsWith('issue') ? 'Issues' : 'Projects');
      if (label) return `${label}: ${m[1]}`;
    }
    return null;
  }

  function translated(source, node) {
    if (source.length > maxSourceLength + 128) return source;
    if (dictionary.has(source)) return dictionary.get(source);
    const key = source.trim().replace(/\s+/g, ' ');
    if (!key) return source;
    if (normalized.has(key)) {
      const value = normalized.get(key);
      return source.slice(0, source.length - source.trimStart().length) + value +
        source.slice(source.trimEnd().length);
    }
    const patterned = patternTranslate(key);
    if (patterned) {
      // 수량 패턴은 버튼류에서만
      if (/^\d[\d,]* (issues?|projects?)$/.test(key)) {
        const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        if (!element?.closest('button,[role="button"],[role="menuitem"],[role="option"]')) return source;
      }
      return source.slice(0, source.length - source.trimStart().length) + patterned +
        source.slice(source.trimEnd().length);
    }
    return source;
  }

  function update(node, field) {
    const current = field === '#text' ? node.nodeValue : node.getAttribute(field);
    if (current === null || current === '') return;
    let fields = original.get(node);
    const previous = fields?.get(field);
    const source = previous && current === previous.output ? previous.source : current;
    const output = translated(source, node);
    if (output === source && !previous) return;
    if (!fields) { fields = new Map(); original.set(node, fields); }
    fields.set(field, { source, output });
    if (output !== current) {
      if (field === '#text') node.nodeValue = output;
      else node.setAttribute(field, output);
    }
  }

  function knownUi(text) {
    if (dictionary.has(text)) return true;
    const key = text.trim().replace(/\s+/g, ' ');
    if (!key) return false;
    if (normalized.has(key)) return true;
    return RE_MONTH_YEAR.test(key) || RE_MONTH_DAY.test(key);
  }

  function process(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      // 이슈/보드 링크의 사용자 제목은 건너뛰고, 같은 링크 안의 UI 칩(Today 등)만 번역
      if (parent?.closest('a[data-board-item],a[href*="/issue/"]') &&
          !parent.closest('button,[role="button"]') &&
          !knownUi(node.nodeValue || '')) return;
      update(node, '#text');
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (const name of ATTRIBUTES) if (node.hasAttribute(name)) update(node, name);
    }
  }

  function ownMutation(record) {
    const field = record.type === 'characterData' ? '#text' : record.attributeName;
    const previous = original.get(record.target)?.get(field);
    if (!previous) return false;
    const current = field === '#text' ? record.target.nodeValue : record.target.getAttribute(field);
    return current === previous.output;
  }

  function enqueue(node) {
    if (roots.has(document.body)) return;
    if (!node.isConnected || excluded(node)) return;
    roots.add(node);
    if (roots.size > 500) { roots.clear(); roots.add(document.body); }
    schedule();
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (roots.has(document.body)) break;
      if (record.type === 'childList') {
        for (const node of record.addedNodes) {
          enqueue(node);
          if (roots.has(document.body)) break;
        }
      } else if (!ownMutation(record)) enqueue(record.target);
    }
  });

  function schedule() {
    if (scheduled !== null || document.hidden) return;
    scheduled = requestAnimationFrame(flush);
  }

  function flush() {
    scheduled = null;
    const start = performance.now();
    let count = 0;
    while (count < 600 && performance.now() - start < 4) {
      if (!walker) {
        const next = roots.values().next();
        if (next.done) break;
        activeRoot = next.value;
        roots.delete(activeRoot);
        if (!activeRoot.isConnected || excluded(activeRoot)) continue;
        process(activeRoot);
        count++;
        if (activeRoot.nodeType === Node.ELEMENT_NODE && activeRoot.matches(SKIP)) {
          activeRoot = null;
          continue;
        }
        walker = document.createTreeWalker(activeRoot, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            if (node.nodeType === Node.ELEMENT_NODE && node.matches(SKIP)) {
              if (node.matches(EDITABLE)) process(node);
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        });
      }
      if (!activeRoot.isConnected || excluded(activeRoot)) { walker = null; continue; }
      const node = walker.nextNode();
      if (!node) { walker = null; activeRoot = null; continue; }
      roots.delete(node);
      process(node);
      count++;
    }
    if (roots.size || walker) schedule();
  }

  async function reload() {
    const request = ++generation;
    let result;
    try { result = await chrome.runtime.sendMessage({ type: 'LINEAR_KO_PACK' }); }
    catch { return; }
    if (request !== generation || !result?.messages || result.error) return;
    dictionary = new Map(Object.entries(result.messages));
    normalized = new Map();
    maxSourceLength = 0;
    for (const [key, value] of dictionary) {
      maxSourceLength = Math.max(maxSourceLength, key.length);
      const clean = key.trim().replace(/\s+/g, ' ');
      if (clean) normalized.set(clean, value.trim());
    }
    observer.disconnect();
    roots.clear(); walker = null; activeRoot = null;
    if (!document.body) return;
    observer.observe(document.body, {
      subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ATTRIBUTES,
    });
    enqueue(document.body);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && (roots.size || walker)) schedule();
  });
  window.addEventListener('pageshow', (event) => { if (event.persisted) void reload(); });
  window.addEventListener('pagehide', () => {
    if (scheduled !== null) cancelAnimationFrame(scheduled);
    scheduled = null;
    observer.disconnect();
    roots.clear(); walker = null;
  });
  void reload();
})();
