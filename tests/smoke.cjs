const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const scratch = path.join(root, 'work');
const output = path.join(scratch, 'test-output');
fs.mkdirSync(output, { recursive:true });
const results = [];
const questions = [
  '我想做一个周末的城市漫步计划，有什么建议？',
  '如果只有半天时间，路线应该怎么调整？',
  '帮我比较一下骑车和步行这两种方式',
  '可以把刚才的路线整理成一个清单吗？',
  '下雨的话，有哪些室内备选安排？',
  '预算控制在 200 元以内应该怎么安排？',
  '最后帮我总结一下出发前需要准备的物品'
];
const escape = text => text.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
function fixture() {
 return `<!doctype html><html class="light"><head><meta charset="utf-8"><title>提问地图 · 离线演示</title><style>
 *{box-sizing:border-box}body{margin:0;font:15px/1.9 'Segoe UI','Microsoft YaHei',sans-serif;color:#25352e;background:#fff}aside{position:fixed;inset:0 auto 0 0;width:220px;background:#f6f8f6;padding:32px 25px;border-right:1px solid #edf0ed}aside b{font-size:18px}aside p{font-size:13px;color:#839087;margin-top:25px}.main{margin-left:220px}header.page{height:64px;padding:15px 38px;border-bottom:1px solid #eef2ee;color:#718077}header small{float:right;color:#148568}.chat{height:calc(100vh - 64px);overflow:auto;padding:25px 370px 120px 55px;scroll-behavior:auto}article{max-width:650px;margin:0 auto 35px}[data-message-author-role=user]{background:#eff3ef;border-radius:18px;padding:15px 20px;margin-left:50px;max-width:600px}[data-message-author-role=assistant]{padding:22px 0;color:#65746b;min-height:175px}.composer{position:fixed;bottom:18px;left:calc(220px + 6%);right:380px;border:1px solid #e4eae5;background:white;border-radius:18px;padding:14px 20px;color:#9aa69e;box-shadow:0 8px 30px #00000006}.dark body{background:#202421;color:#e4ece5}.dark aside{background:#191d1a;border-color:#333}.dark [data-message-author-role=user]{background:#303a33}.dark .composer{background:#29312b;border-color:#414b43}.dark header.page{border-color:#38423b}
 </style></head><body><aside><b>对话工作区</b><p>＋ 开始新对话</p><p>最近的对话</p><p style="color:#148568">周末城市漫步计划</p><p>阅读笔记与灵感</p><p>一个小项目的构想</p></aside><div class="main"><header class="page">周末城市漫步计划 <small>离线演示 · 示例消息</small></header><main class="chat">${questions.map((q,i)=>`<article data-testid="conversation-turn-${i*2}"><div data-message-author-role="user">${escape(q)}</div></article><article data-testid="conversation-turn-${i*2+1}"><div data-message-author-role="assistant">可以从出行时间、沿途停留点和预算三个角度安排。<br><br>这是一段用于验证目录定位的示例回答。你可以通过右侧的提问地图，在不同问题之间快速切换。</div></article>`).join('')}</main></div><div class="composer">向对话发送消息…</div></body></html>`;
}
async function check(name, task) { await task(); results.push(name); console.log('PASS', name); }
(async () => {
 const browserOptions = process.env.TEST_BROWSER_EXECUTABLE
  ? { executablePath:process.env.TEST_BROWSER_EXECUTABLE }
  : { channel:process.platform === 'win32' ? 'msedge' : 'chromium' };
 const context = await chromium.launchPersistentContext(path.join(scratch, 'edge-test-profile'), {
  ...browserOptions, headless:true,
  viewport:{width:1440,height:980}, reducedMotion:'reduce',
  args:[`--disable-extensions-except=${root}`, `--load-extension=${root}`, '--no-first-run']
 });
 try {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://chatgpt.com/**', route => route.fulfill({contentType:'text/html; charset=utf-8',body:fixture()}));
  await page.goto('https://chatgpt.com/c/offline-fixture');
  let extensionLoaded = true;
  try { await page.locator('#gpt-question-map-root').waitFor({timeout:6000}); }
  catch {
    extensionLoaded = false;
    await page.addScriptTag({path:path.join(root,'history.js')});
    await page.addScriptTag({path:path.join(root,'content.js')});
  }
  results.push(extensionLoaded ? 'Edge 自动加载真实扩展内容脚本' : 'Edge 未自动加载扩展，使用相同内容脚本进行 DOM 集成验证');
  console.log('EXTENSION_LOADED', extensionLoaded);
  const map = page.locator('#gpt-question-map-root');
  await check('识别全部用户提问，不包含助手回答', async () => {
   await assert.doesNotReject(() => page.waitForFunction(() => document.querySelector('#gpt-question-map-root').shadowRoot.querySelector('#total').textContent === '7'));
  });
  await check('打开地图与全文搜索', async () => {
   if (!(await map.locator('#panel').isVisible())) await map.locator('#launch').click();
   await map.locator('#search').fill('预算');
   assert.equal(await map.locator('.item').count(),1);
   assert.match(await map.locator('.item').textContent(),/200/);
  });
  await check('跳转使用实际消息所在的嵌套滚动容器', async () => {
   await map.locator('#search').fill('半天');
   await map.locator('.item').click();
   const y = await page.locator('[data-message-author-role=user]').nth(1).evaluate(node=>node.getBoundingClientRect().top);
   assert.ok(y >= 140 && y <= 170, `position=${y}`);
   assert.equal(await page.evaluate(()=>window.scrollY),0);
   assert.equal(await map.locator('.item[aria-current=true]').count(),1);
  });
  await check('手动滚动同步高亮，上一问下一问可用', async () => {
   await map.locator('#search').fill('');
   await map.locator('.item').nth(3).click();
   await map.locator('#prev').click();
   assert.equal(await map.locator('.item[aria-current=true]').getAttribute('data-index'),'2');
   await map.locator('#next').click();
   assert.equal(await map.locator('.item[aria-current=true]').getAttribute('data-index'),'3');
   await page.locator('.chat').evaluate(node=>node.scrollTop=0);
   await page.waitForTimeout(150);
   assert.equal(await map.locator('.item[aria-current=true]').getAttribute('data-index'),'0');
  });
  await check('新提问和编辑内容自动更新', async () => {
   await page.locator('.chat').evaluate(node=>{
    const turn=document.createElement('article');turn.dataset.testid='conversation-turn-14';
    const user=document.createElement('div');user.dataset.messageAuthorRole='user';user.textContent='新追加的问题';turn.append(user);node.append(turn);
   });
   await page.waitForTimeout(450);
   assert.equal(await map.locator('.item').count(),8);
   await page.locator('[data-message-author-role=user]').last().evaluate(node=>node.textContent='修改后的问题');
   await page.waitForTimeout(450);
   assert.match(await map.locator('.item').last().textContent(),/修改后/);
  });
  await check('用户文本作为纯文本处理，图片提问有占位标题', async () => {
   await page.locator('[data-message-author-role=user]').last().evaluate(node=>node.textContent='<img src=x onerror="window.__unsafe=1">');
   await page.waitForTimeout(400);
   assert.equal(await map.locator('.item img').count(),0);
   assert.equal(await page.evaluate(()=>window.__unsafe),undefined);
   await page.locator('[data-message-author-role=user]').last().evaluate(node=>{node.textContent='';const img=document.createElement('img');img.alt='路线示意图';node.append(img)});
   await page.waitForTimeout(400);
   assert.match(await map.locator('.item').last().textContent(),/路线示意图/);
  });
  await check('切换对话清除旧目录和搜索，兼容备用轮次标记', async () => {
   await map.locator('#search').fill('不存在的关键词');
   assert.equal(await map.locator('.item').count(),0);
   await page.evaluate(()=>{history.pushState({},'', '/c/another-fixture');document.querySelector('.chat').innerHTML='<article data-testid="conversation-turn-0" data-turn="user">另一段对话的提问</article>'});
   await page.waitForTimeout(1250);
   assert.equal(await map.locator('.item').count(),1);
   assert.equal(await map.locator('#search').inputValue(),'');
   assert.match(await map.locator('.item').textContent(),/另一段/);
  });
  await check('长对话刻度有上限，完整目录保留 120 个问题', async () => {
   await page.locator('.chat').evaluate(node=>{history.replaceState({},'', '/c/long-fixture');node.innerHTML='';for(let i=0;i<120;i++){const t=document.createElement('article');t.dataset.testid=`conversation-turn-${i}`;t.dataset.turn='user';t.textContent=`问题 ${i+1}`;node.append(t)}});
   await page.waitForTimeout(500);
   assert.equal(await map.locator('.item').count(),120);
   assert.equal(await map.locator('.mark').count(),36);
   assert.equal(await map.locator('.mark').last().getAttribute('data-index'),'119');
   await map.locator('.item').nth(2).click();
   assert.equal(await map.locator('.mark[aria-current=true]').count(),1);
  });
  await check('兼容不占布局的提问容器和不同轮次标记', async () => {
   await page.locator('.chat').evaluate(node=>{
    history.replaceState({},'', '/c/layout-fixture');
    node.innerHTML='<article data-testid="conversation-turn-0"><div data-message-author-role="user" style="display:contents"><div>透明布局容器里的问题</div></div></article><article data-turn="user"><div>只有轮次标记的问题</div></article><article><h5 class="sr-only">You said:</h5><div>通过发言者标题识别的问题</div></article>';
   });
   await page.waitForTimeout(450);
   assert.equal(await map.locator('.item').count(),3);
   await map.locator('.item').first().click();
   const y=await page.locator('[data-message-author-role=user] > div').evaluate(node=>node.getBoundingClientRect().top);
   assert.ok(y>=64 && y<850);
   await page.locator('.chat').evaluate(node=>{
    const turn=document.createElement('article');
    turn.innerHTML='<div data-testid="user-message" style="display:none">稍后显示的问题</div>';
    node.append(turn);
   });
   await page.waitForTimeout(350);
   assert.equal(await map.locator('.item').count(),3);
   await page.locator('[data-testid=user-message]').evaluate(node=>node.style.display='block');
   await page.waitForTimeout(350);
   assert.equal(await map.locator('.item').count(),4);
   await map.locator('#search').fill('不存在');
   await map.locator('#rescan').click();
   assert.equal(await map.locator('#search').inputValue(),'');
   assert.equal(await map.locator('.item').count(),4);
  });
  await check('用户提供的新气泡结构：无旧标记时识别、搜索、跳转及动态新增', async () => {
   await page.locator('.chat').evaluate(node=>{
    history.replaceState({},'', '/c/bubble-fixture');
    const bubble='<div data-user-message-bubble="true" class="bg-user-message text-user-message min-w-0 max-w-(--user-chat-width) overflow-hidden break-words px-(--thread-content-margin) [&amp;_.contain-inline-size]:[contain:initial] bubble-vBnidZ py-2.5 rounded-2xl relative text-start"><div class="flex flex-col items-end gap-1"><div class="relative w-full min-w-0 text-size-chat leading-relaxed"><div class="" data-search-result-target=""><div><div class="text-size-chat whitespace-pre-wrap" dir="auto">继续</div></div></div></div></div></div>';
    node.innerHTML=Array.from({length:9},(_,i)=>'<div style="margin-bottom:30px">'+bubble.replace('>继续<',`>${i===0?'继续':`第 ${i+1} 个问题`}<`)+'<div style="height:240px">模拟助手回答，不应该被索引</div></div>').join('');
   });
   await page.waitForTimeout(450);
   assert.equal(await page.locator('article,[data-message-author-role],[data-turn],[data-testid^="conversation-turn-"]').count(),0);
   assert.equal(await map.locator('.item').count(),9);
   assert.equal(await map.locator('.item .label').first().textContent(),'继续');
   await map.locator('#search').fill('第 5 个');
   assert.equal(await map.locator('.item').count(),1);
   await map.locator('.item').click();
   const y=await page.locator('[data-user-message-bubble=true]').nth(4).evaluate(node=>node.getBoundingClientRect().top);
   assert.ok(y>=140 && y<=170,`bubble top=${y}`);
   await map.locator('#search').fill('');
   await page.locator('.chat').evaluate(node=>{const wrap=document.createElement('div');wrap.innerHTML='<div class="bg-user-message">标记稍后添加的提问</div>';node.append(wrap)});
   await page.waitForTimeout(300);
   assert.equal(await map.locator('.item').count(),9);
   await page.locator('.chat > div').last().locator('.bg-user-message').evaluate(node=>node.setAttribute('data-user-message-bubble','true'));
   await page.waitForTimeout(350);
   assert.equal(await map.locator('.item').count(),10);
   await page.locator('.chat').evaluate(node=>{const wrap=document.createElement('div');wrap.dataset.messageAuthorRole='user';const bubble=document.createElement('div');bubble.dataset.userMessageBubble='true';bubble.textContent='同时包含新旧标记的提问';wrap.append(bubble);node.append(wrap)});
   await page.waitForTimeout(350);
   assert.equal(await map.locator('.item').count(),11);
   assert.equal(await map.locator('.item .label').last().textContent(),'同时包含新旧标记的提问');
  });
  await check('每次仅挂载 7 条的虚拟长对话：收录 42 条、保留、搜索与恢复定位', async () => {
   await page.locator('.chat').evaluate(chat=>{
    history.replaceState({},'', '/c/virtual-history');
    chat.style.padding='0';
    chat.innerHTML='<div id="virtual-content" style="height:9240px;position:relative"></div>';
    const content=chat.firstElementChild;
    let last=-1;
    const render=()=>{
     const first=Math.max(0,Math.min(35,Math.floor(chat.scrollTop/220)));
     if(first===last)return;last=first;
     content.replaceChildren();
     for(let i=first;i<first+7;i++){
      const row=document.createElement('div');row.dataset.fixtureRow=String(i);row.style.cssText=`position:absolute;top:${i*220}px;left:40px;width:600px;height:210px`;
      const bubble=document.createElement('div');bubble.dataset.userMessageBubble='true';bubble.textContent=i%4===0?'继续':`历史提问 ${i+1}`;bubble.style.cssText='background:#eff3ef;padding:12px;border-radius:14px';
      row.append(bubble);const answer=document.createElement('div');answer.textContent='示例回答';row.append(answer);content.append(row);
     }
    };
    chat.addEventListener('scroll',render);
    chat.scrollTop=7700;render();
    window.__virtualCleanup=()=>chat.removeEventListener('scroll',render);
   });
   await page.waitForTimeout(500);
   assert.equal(await map.locator('.item').count(),7);
   assert.equal(await page.locator('[data-user-message-bubble]').count(),7);
   await map.locator('#load-history').click();
   await page.waitForTimeout(700);
   await page.waitForFunction(()=>document.querySelector('#gpt-question-map-root').shadowRoot.querySelector('#load-history').textContent==='收录更早提问',{},{timeout:20000});
   assert.equal(await map.locator('.item').count(),42);
   assert.equal(await page.locator('[data-user-message-bubble]').count(),7);
   assert.equal(await map.locator('.item .label').first().textContent(),'继续');
   assert.equal(await map.locator('.item .label').nth(1).textContent(),'历史提问 2');
   assert.equal(await map.locator('.item .label').last().textContent(),'历史提问 42');
   assert.equal(await map.locator('.item .label').filter({hasText:/^继续$/}).count(),11);
   await map.locator('#search').fill('历史提问 2');
   assert.ok(await map.locator('.item').count()>0);
   await map.locator('.item').first().click();
   await page.waitForTimeout(700);
   const bubble=page.locator('[data-fixture-row="1"] [data-user-message-bubble]');
   assert.equal(await bubble.count(),1);
   assert.ok((await bubble.boundingBox()).y<400);
   await map.locator('#search').fill('');
   assert.equal(await map.locator('.item').count(),42);
   await page.evaluate(()=>window.__virtualCleanup());
  });
  await check('切换对话后缓存独立，返回可恢复已收录历史', async () => {
   await map.locator('#load-history').click();
   await page.waitForTimeout(100);
   await page.locator('.chat').evaluate(chat=>{history.pushState({},'', '/c/isolated-history');chat.innerHTML='<div data-user-message-bubble="true">另一段独立对话</div>'});
   await page.waitForTimeout(500);
   assert.equal(await map.locator('.item').count(),1);
   await page.locator('.chat').evaluate(chat=>{history.pushState({},'', '/c/virtual-history');chat.innerHTML='<div data-message-id="history-1"><div data-user-message-bubble="true">历史提问 2</div></div>'});
   await page.waitForTimeout(500);
   assert.equal(await map.locator('.item').count(),42);
   assert.equal(await map.locator('.item .label').filter({hasText:'另一段独立对话'}).count(),0);
  });
  await check('新聊天生成对话地址时保留首条提问', async () => {
   await page.locator('.chat').evaluate(chat=>{history.pushState({},'', '/');chat.innerHTML='<div data-user-message-bubble="true">新聊天的第一条提问</div>'});
   await page.waitForTimeout(400);
   assert.equal(await map.locator('.item').count(),1);
   await page.evaluate(()=>history.pushState({},'', '/c/newly-created'));
   await page.waitForTimeout(1000);
   assert.equal(await map.locator('.item').count(),1);
   assert.match(await map.locator('.item .label').textContent(),/第一条/);
  });
  await check('空对话提示、重复执行不重复注入', async () => {
   await page.locator('.chat').evaluate(node=>{history.replaceState({},'', '/c/empty-fixture');node.innerHTML=''});
   await page.waitForTimeout(450);
   assert.equal(await map.locator('.item').count(),0);
   assert.match(await map.locator('.empty').textContent(),/还没有发现/);
   await page.addScriptTag({path:path.join(root,'content.js')});
   assert.equal(await page.locator('#gpt-question-map-root').count(),1);
  });
  await check('快捷键、Escape 与窄窗口布局', async () => {
   await map.locator('#close').click();
   await page.keyboard.press('Alt+Shift+M');
   assert.equal(await map.locator('#panel').isVisible(),true);
   await page.keyboard.press('Escape');
   assert.equal(await map.locator('#panel').isVisible(),false);
   await page.setViewportSize({width:390,height:844});
   await map.locator('#launch').click();
   const box=await map.locator('#panel').boundingBox();
   assert.ok(box.x>=0 && box.x+box.width<=390);
  });
  await page.setViewportSize({width:1440,height:980});
  await page.goto('https://chatgpt.com/c/preview');
  if (!extensionLoaded) { await page.addScriptTag({path:path.join(root,'history.js')}); await page.addScriptTag({path:path.join(root,'content.js')}); }
  await page.waitForTimeout(500);
  if (!(await map.locator('#panel').isVisible())) await map.locator('#launch').click();
  await map.locator('.item').nth(3).click();
  await page.mouse.move(800,300);
  await page.screenshot({path:path.join(output,'提问地图-效果预览.png')});
  await check('跟随深色主题', async () => {
   await page.locator('html').evaluate(node=>node.className='dark');
   await page.waitForTimeout(200);
   assert.equal(await map.getAttribute('data-theme'),'dark');
   assert.equal(await map.locator('#panel').evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(37, 42, 40)');
  });
  await page.screenshot({path:path.join(output,'提问地图-深色预览.png')});
  if (extensionLoaded) await check('工具栏菜单连接、启用开关与偏好持久化', async () => {
   const storageDir=path.join(scratch,'edge-test-profile','Default','Local Extension Settings');
   const extensionId=fs.readdirSync(storageDir).find(name=>/^[a-p]{32}$/.test(name));
   assert.ok(extensionId);
   const popup=await context.newPage();
   await page.bringToFront();
   await popup.goto(`chrome-extension://${extensionId}/popup.html`);
   await popup.waitForTimeout(300);
   assert.match(await popup.locator('#status').textContent(),/已收录 7/);
   await popup.locator('#diagnostics').click();
   const report=JSON.parse(await popup.locator('#report').inputValue());
   assert.equal(report.version,'1.1.0');
   assert.equal(report.identified,7);
   assert.equal(report.bubbleMarkers,0);
   assert.equal(report.roleMarkers,7);
   assert.equal(Object.values(report).includes(questions[0]),false);
   await popup.locator('#enabled').uncheck();
   await page.waitForTimeout(250);
   assert.equal(await map.isVisible(),false);
   await popup.reload();
   assert.equal(await popup.locator('#enabled').isChecked(),false);
   await popup.locator('#enabled').check();
   await page.waitForTimeout(300);
   assert.equal(await map.isVisible(),true);
   await popup.close();
  });
  assert.deepEqual(errors,[]);
  results.push('无页面 JavaScript 异常');
  fs.writeFileSync(path.join(output,'TESTING.md'),`# Test report\n\nDate: ${new Date().toISOString().slice(0,10)}.\n\nIsolated browser profile; chatgpt.com is intercepted with an offline fixture. Extension loaded: ${extensionLoaded}.\n\n${results.map(s=>'- PASS: '+s).join('\n')}\n\nFixtures and screenshots contain simulated messages. This does not test a signed-in ChatGPT account.\n`, 'utf8');
  console.log('ALL CHECKS PASSED');
 } finally { await context.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
