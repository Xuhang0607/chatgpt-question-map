'use strict';
const enabled = document.getElementById('enabled');
const status = document.getElementById('status');
const toggle = document.getElementById('toggle');
let tabId;
chrome.storage.local.get('mapEnabled').then(settings => { enabled.checked = settings.mapEnabled !== false; });
enabled.addEventListener('change', () => chrome.storage.local.set({ mapEnabled:enabled.checked }));
(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
    tabId = tab.id;
    const result = await chrome.tabs.sendMessage(tabId, { type:'question-map-status' });
    status.textContent = `已收录 ${result.count} 个提问，网页当前加载 ${result.loaded ?? result.count} 个`;
  } catch {
    toggle.disabled = true;
    status.textContent = '请打开或刷新 ChatGPT 网页后再使用。';
  }
})();
toggle.addEventListener('click', async () => {
  try {
    await chrome.tabs.sendMessage(tabId, { type:'question-map-toggle' });
    window.close();
  } catch { status.textContent = '连接失效，请刷新 ChatGPT 网页。'; }
});
document.getElementById('diagnostics').addEventListener('click', async () => {
  const report = document.getElementById('report');
  report.hidden = false;
  try {
    const result = await chrome.tabs.sendMessage(tabId, { type:'question-map-diagnostics' });
    report.value = JSON.stringify(result, null, 2);
    if (!result.version) report.value = '页面仍在运行旧版脚本，请刷新 ChatGPT 页面。';
  } catch { report.value = '无法连接页面。请确认当前标签页是 ChatGPT，并在更新扩展后刷新网页。'; }
  report.focus();
  report.select();
});
