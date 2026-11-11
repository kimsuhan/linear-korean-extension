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
  // 단수형: [한국어 이름, 단위]
  const COUNT_NOUNS = {
    type: ['유형', '개'], 'api key': ['API 키', '개'], status: ['상태', '개'], template: ['템플릿', '개'],
    'issue template': ['이슈 템플릿', '개'], label: ['라벨', '개'], loop: ['루프', '개'], team: ['팀', '개'],
    pipeline: ['파이프라인', '개'], member: ['멤버', '명'], user: ['사용자', '명'],
  };
  const RE_COUNT = new RegExp(`^(\\d+(?:,\\d{3})*) (${Object.keys(COUNT_NOUNS).join('|')})(?:e?s)?$`, 'i');
  const original = new WeakMap();
  let dictionary = new Map();
  const normalized = new Map();
  let maxSourceLength = 0;
  let scheduled = null;
  let walker = null;
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

  // element: 문구가 놓인 요소. 문맥에 따라 번역 여부가 갈리는 패턴에 쓴다
  function patternTranslate(key, element) {
    let m = key.match(RE_MONTH_YEAR);
    if (m) return `${m[2]}년 ${MONTHS[m[1]]}월`;
    const date = dateText(key);
    if (date) return date;
    const inButton = !!element.closest('button,[role="button"]');
    // 이슈/보드 링크 안에서 날짜가 아닌 문구는 사용자 제목일 수 있다
    if (!inButton && element.closest('a[data-board-item],a[href*="/issue/"]')) return null;
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
      const [label, counter] = COUNT_NOUNS[m[2].toLowerCase()];
      return `${label} ${m[1]}${counter}`;
    }
    m = key.match(/^(\d+(?:,\d{3})*) (issues?|projects?)$/);
    // 본문의 "3 issues"는 문장 일부일 수 있어 버튼류에서만 바꾼다
    if (m && (inButton || element.closest('[role="menuitem"],[role="option"]'))) {
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
    const value = normalized.get(key) ??
      patternTranslate(key, node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement);
    if (value === null) return source;
    return source.slice(0, source.length - source.trimStart().length) + value +
      source.slice(source.trimEnd().length);
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

  function process(node) {
    if (node.nodeType === Node.TEXT_NODE) update(node, '#text');
    else if (node.nodeType === Node.ELEMENT_NODE) {
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
    // 숨은 탭에서는 브라우저가 rAF를 미뤘다가 보일 때 실행한다
    if (scheduled === null) scheduled = requestAnimationFrame(flush);
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

  function flush() {
    scheduled = null;
    // 프레임 사이에 순회 중이던 루트가 떨어졌거나 편집 영역이 됐을 수 있다
    if (walker && (!walker.root.isConnected || excluded(walker.root))) walker = null;
    const start = performance.now();
    let count = 0;
    while (count < 600 && performance.now() - start < 4) {
      if (!walker) {
        const next = roots.values().next();
        if (next.done) break;
        const root = next.value;
        roots.delete(root);
        if (!root.isConnected || excluded(root)) continue;
        process(root);
        count++;
        if (root.nodeType === Node.ELEMENT_NODE && root.matches(SKIP)) continue;
        walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            if (node.nodeType === Node.ELEMENT_NODE && node.matches(SKIP)) {
              if (node.matches(EDITABLE)) process(node);
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        });
      }
      const node = walker.nextNode();
      if (!node) { walker = null; continue; }
      roots.delete(node);
      process(node);
      count++;
    }
    if (roots.size || walker) scheduled = requestAnimationFrame(flush);
  }

  async function start() {
    let result;
    try { result = await chrome.runtime.sendMessage({ type: 'LINEAR_KO_PACK' }); }
    catch { return; }
    if (!result?.messages || !document.body) return;
    dictionary = new Map(Object.entries(result.messages));
    for (const [key, value] of dictionary) {
      maxSourceLength = Math.max(maxSourceLength, key.length);
      const clean = key.trim().replace(/\s+/g, ' ');
      if (clean) normalized.set(clean, value.trim());
    }
    observer.observe(document.body, {
      subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ATTRIBUTES,
    });
    enqueue(document.body);
  }

  void start();
})();
