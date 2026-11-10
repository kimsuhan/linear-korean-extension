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
  if (sender.id !== chrome.runtime.id || message?.type !== 'LINEAR_KO_PACK') return;
  loadPack()
    .then((messages) => reply({ locale: 'ko', messages }))
    .catch(() => reply({ locale: 'ko', messages: {}, error: true }));
  return true;
});
