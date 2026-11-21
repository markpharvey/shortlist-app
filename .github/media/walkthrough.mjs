// Drives the running app with Playwright: a visible cursor moves to each control,
// typing is shown key by key, and every step is screenshotted and timestamped so
// narration can be lined up with the video afterwards.
//
//   node walkthrough.mjs <base url> <output folder>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:5080';
const out = process.argv[3] ?? 'out';
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  recordVideo: { dir: out, size: { width: 1280, height: 720 } },
});

// A drawn cursor and click ripple, since headless video has no pointer.
await context.addInitScript(() => {
  addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.id = '__cursor';
    c.style.cssText = 'position:fixed;z-index:2147483647;left:0;top:0;width:22px;height:22px;pointer-events:none;' +
      'transform:translate(-3px,-2px);transition:none';
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-7.5L20 11z" fill="#111" stroke="#fff" stroke-width="1.5"/></svg>';
    document.body.appendChild(c);
    const saved = sessionStorage.getItem('__cursor');
    if (saved) { const [x, y] = JSON.parse(saved); c.style.left = x + 'px'; c.style.top = y + 'px'; }
    addEventListener('mousemove', e => {
      c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px';
      sessionStorage.setItem('__cursor', JSON.stringify([e.clientX, e.clientY]));
    }, true);
    addEventListener('mousedown', e => {
      const r = document.createElement('div');
      r.style.cssText = `position:fixed;z-index:2147483646;pointer-events:none;left:${e.clientX - 18}px;top:${e.clientY - 18}px;` +
        'width:36px;height:36px;border-radius:50%;border:3px solid #f59e0b;opacity:1;transition:all .45s ease-out';
      document.body.appendChild(r);
      requestAnimationFrame(() => { r.style.transform = 'scale(1.8)'; r.style.opacity = '0'; });
      setTimeout(() => r.remove(), 500);
    }, true);
  });
});

const page = await context.newPage();
const t0 = Date.now();
const steps = [];
let n = 0;
let mouse = { x: 640, y: 360 };

const pause = ms => page.waitForTimeout(ms);
async function step(name, note) {
  await pause(400);
  n += 1;
  const file = `${String(n).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(out, file) });
  steps.push({ n, name, note, file, ms: Date.now() - t0, url: page.url().replace(base, '') });
  console.log(`${n} ${name} ${page.url()}`);
}
async function moveTo(locator) {
  await locator.scrollIntoViewIfNeeded();
  const b = await locator.boundingBox();
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y, { steps: 28 });
  mouse = { x, y };
  await pause(150);
}
async function click(locator) { await moveTo(locator); await locator.click(); await pause(350); }
async function type(locator, text) { await click(locator); await locator.pressSequentially(text, { delay: 55 }); }
const nav = name => page.getByRole('navigation').getByRole('link', { name, exact: true });

await page.goto(base + '/');
await page.mouse.move(mouse.x, mouse.y);
await page.getByRole('heading', { name: 'Welcome' }).waitFor();
await pause(1200);
await step('home', 'The home page');

// Theme: auto -> light -> dark
const theme = page.locator('.theme-toggle-btn');
await click(theme); await click(theme);
await step('dark-theme', 'Theme toggle switched to dark');

await click(nav('Counter'));
const inc = page.getByRole('button', { name: 'Increment' });
for (let i = 0; i < 3; i++) await click(inc);
await step('counter', 'Counter after three clicks');

await click(nav('Weather'));
await page.getByRole('heading', { name: 'Log in' }).waitFor();
await step('weather-needs-login', 'Weather is protected, so we land on Log in');

await click(nav('Register'));
const email = 'mark@shortlist.dev', password = 'Shortlist1!';
await type(page.locator('#email'), email);
await type(page.locator('#password'), password);
await step('register-filled', 'Registering a new account');
await click(page.getByRole('button', { name: 'Register' }));
await page.getByRole('heading', { name: 'Log in' }).waitFor();

await type(page.locator('#email'), email);
await type(page.locator('#password'), password);
await click(page.getByRole('button', { name: 'Log in' }));
await page.getByRole('link', { name: 'Log out' }).waitFor();
await step('logged-in', 'Logged in');

await click(nav('Weather'));
await page.locator('table tbody tr').first().waitFor();
await step('weather', 'Weather data fetched from the C# API');

await click(nav('Tasks'));
await page.getByRole('heading', { name: 'Lists' }).waitFor();
await step('tasks', 'The Tasks page with its seeded list');

await click(page.locator('.todo-sidebar .todo-panel-header button'));
await type(page.locator('#newListTitle'), 'Job applications');
await click(page.locator('dialog[open] .colour-swatch').nth(2));
await step('new-list-dialog', 'Creating a list');
await click(page.locator('dialog[open]').getByRole('button', { name: 'Create' }));
await page.locator('.todo-main h2', { hasText: 'Job applications' }).waitFor();

for (const t of ['Apply to TechnologyOne', 'Follow up the recruiter', 'Prepare for the interview']) {
  await click(page.locator('.todo-new-item-placeholder'));
  await page.locator('#newItemInput').pressSequentially(t, { delay: 45 });
  await page.keyboard.press('Enter');
  await page.locator('.todo-main .todo-item-text', { hasText: t }).waitFor();
  await pause(300);
}
await step('items-added', 'Three tasks added');

await click(page.locator('.todo-main .todo-item input[type=checkbox]').first());
await step('item-done', 'First task ticked off');

await click(page.locator('.todo-main .todo-item .icon-btn').nth(1));
await moveTo(page.locator('#itemPriority'));
await page.locator('#itemPriority').selectOption({ label: 'High' });
await type(page.locator('#itemNote'), 'Recruiter: call back Tuesday');
await step('item-details', 'Setting priority and a note');
await click(page.locator('dialog[open]').getByRole('button', { name: 'Update' }));
await pause(500);

await page.reload();
await page.getByRole('heading', { name: 'Lists' }).waitFor();
await click(page.locator('.todo-sidebar li', { hasText: 'Job applications' }));
await step('after-reload', 'After a reload: everything was saved by the API');

await click(page.getByRole('link', { name: 'Log out' }));
await page.getByRole('heading', { name: 'Log in' }).waitFor();
await step('logged-out', 'Logged out');
await pause(800);

const video = page.video();
await context.close();
await browser.close();
fs.renameSync(await video.path(), path.join(out, 'walkthrough.webm'));
fs.writeFileSync(path.join(out, 'steps.json'), JSON.stringify(steps, null, 2));
console.log('done', steps.length, 'steps');
