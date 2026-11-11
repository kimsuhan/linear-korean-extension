'use strict';

let pack = null;

async function loadPack() {
  if (pack) return pack;
  const response = await fetch(chrome.runtime.getURL('locales/ko.json'));
  if (!response.ok) throw new Error('Korean pack unavailable');
  pack = await response.json();
  return pack;
}

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message?.type !== 'LINEAR_KO_PACK') return;
  // 실패하면 messages 없이 답해 콘텐츠 스크립트가 아무것도 하지 않게 한다
  loadPack().then((messages) => reply({ messages }), () => reply({}));
  return true;
});
