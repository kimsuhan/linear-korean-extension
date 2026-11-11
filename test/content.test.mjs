// content.js를 가짜 DOM에서 실행해 번역 규칙을 확인한다. 실행: node --test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

// context: plain | link(이슈 링크 안) | button | menuitem
export async function load(source, messages) {
  const frames = [];
  let observe;
  vm.runInNewContext(source, {
    Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 },
    NodeFilter: { SHOW_ELEMENT: 1, SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2 },
    document: {
      body: element('plain'),
      hidden: false,
      addEventListener() {},
      createTreeWalker: (root) => ({ root, nextNode: () => null }),
    },
    window: { addEventListener() {} },
    MutationObserver: class {
      constructor(callback) { observe = callback; }
      observe() {}
      disconnect() {}
    },
    requestAnimationFrame: (callback) => frames.push(callback),
    cancelAnimationFrame() {},
    performance,
    chrome: { runtime: { sendMessage: async () => ({ messages }) } },
  });
  await new Promise((resolve) => setImmediate(resolve));
  flush(); // 첫 body 순회를 끝내야 이후 노드가 따로 큐에 들어간다

  function flush() { while (frames.length) frames.shift()(); }

  function element(context, attributes = {}) {
    return {
      nodeType: 1, isConnected: true, parentElement: null,
      matches: () => false,
      closest(selector) {
        if (selector.includes('a[data-board-item]')) return context === 'link' ? this : null;
        if (selector.includes('menuitem') && context === 'menuitem') return this;
        if (selector.startsWith('button') && context === 'button') return this;
        return null;
      },
      hasAttribute: (name) => name in attributes,
      getAttribute: (name) => attributes[name] ?? null,
      setAttribute(name, value) { attributes[name] = value; },
    };
  }
  function run(node) {
    observe([{ type: 'childList', addedNodes: [node] }]);
    flush();
  }
  return {
    text(value, context = 'plain') {
      const node = { nodeType: 3, nodeValue: value, isConnected: true, parentElement: element(context) };
      run(node);
      return node.nodeValue;
    },
    title(value, context = 'plain') {
      const attributes = { title: value };
      run(element(context, attributes));
      return attributes.title;
    },
  };
}

const page = await load(read('../js/content.js'), JSON.parse(read('../locales/ko.json')));

test('사전: 정확히 일치하면 번역하고 앞뒤 공백은 유지한다', () => {
  assert.equal(page.text('Inbox'), '받은 편지함');
  assert.equal(page.text('  Inbox \n'), '  받은 편지함 \n');
  assert.equal(page.text('Inbox zero today'), 'Inbox zero today');
});

test('날짜와 상대 시간', () => {
  assert.equal(page.text('November 2026'), '2026년 11월');
  assert.equal(page.text('Nov 3'), '11월 3일');
  assert.equal(page.text('Nov 03, 2026'), '2026년 11월 3일');
  assert.equal(page.text('about an hour ago'), '약 1시간 전');
  assert.equal(page.text('1 week ago'), '1주 전');
  assert.equal(page.text('4 weeks ago'), '4주 전');
  assert.equal(page.text('5mo ago'), '5개월 전');
  assert.equal(page.text('in 2 days'), '2일 후');
  assert.equal(page.text('Every 2 weeks'), '2주마다');
  assert.equal(page.text('3 months'), '3개월');
  assert.equal(
    page.text('Current cycle is Nov 2 – Nov 15, next cycle begins Nov 16'),
    '현재 사이클: 11월 2일 – 11월 15일, 다음 사이클 시작: 11월 16일',
  );
});

test('개수', () => {
  assert.equal(page.text('1 member'), '멤버 1명');
  assert.equal(page.text('1,234 members'), '멤버 1,234명');
  assert.equal(page.text('3 statuses'), '상태 3개');
  assert.equal(page.text('1 status'), '상태 1개');
  assert.equal(page.text('2 API keys'), 'API 키 2개');
  assert.equal(page.text('2 issue templates'), '이슈 템플릿 2개');
  assert.equal(page.text('3 levels'), '3단계');
});

test('issues, projects 개수는 버튼류에서만 번역한다', () => {
  assert.equal(page.text('12 issues'), '12 issues');
  assert.match(page.text('12 issues', 'button'), /: 12$/);
  assert.match(page.text('1 project', 'menuitem'), /: 1$/);
});

test('이슈 링크 안에서는 사전과 날짜만 번역한다', () => {
  assert.equal(page.text('Inbox', 'link'), '받은 편지함');
  assert.equal(page.text('Nov 3', 'link'), '11월 3일');
  assert.equal(page.text('3 days ago', 'link'), '3일 전');
  assert.equal(page.text('5 members', 'link'), '5 members');
  assert.equal(page.title('5 members', 'link'), '5 members');
  assert.equal(page.title('5 members', 'button'), '멤버 5명');
});

test('패턴이 처리하는 문구는 사전에 두지 않는다', async () => {
  const messages = JSON.parse(read('../locales/ko.json'));
  const withoutNumbers = Object.fromEntries(Object.entries(messages).filter(([key]) => !/\d/.test(key)));
  const patternOnly = await load(read('../js/content.js'), withoutNumbers);
  const overlapping = Object.keys(messages).filter((key) => /\d/.test(key) && patternOnly.text(key, 'button') !== key);
  assert.deepEqual(overlapping, []);
});

test('속성', () => {
  assert.equal(page.title('Inbox'), '받은 편지함');
  assert.equal(page.title('3 days ago'), '3일 전');
});
