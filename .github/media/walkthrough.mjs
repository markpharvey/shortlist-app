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
async function choose(locator, label) { await moveTo(locator); await locator.selectOption({ label }); await pause(350); }
async function quickType(locator, text) { await click(locator); await locator.fill(''); await locator.pressSequentially(text, { delay: 18 }); }
const dialog = () => page.locator('dialog[open]');

async function addApplication(a) {
  await click(page.getByRole('button', { name: 'Add application' }));
  await dialog().locator('#company').waitFor();
  await quickType(page.locator('#company'), a.company);
  await quickType(page.locator('#jobTitle'), a.title);
  await choose(page.locator('#workArrangement'), a.work);
  if (a.location) await quickType(page.locator('#location'), a.location);
  if (a.commute) await quickType(page.locator('#commuteMinutes'), a.commute);
  await quickType(page.locator('#salaryMin'), a.min);
  await quickType(page.locator('#salaryMax'), a.max);
  await quickType(page.locator('#technologies'), a.stack);
}

try {
  await page.goto(base + '/');
  await page.mouse.move(mouse.x, mouse.y);
  const theme = page.locator('.theme-toggle-btn');
  await click(theme); await click(theme);

  // Sign up and in.
  await click(nav('Register'));
  const email = 'mark@shortlist.dev', password = 'Shortlist1!';
  await type(page.locator('#email'), email);
  await type(page.locator('#password'), password);
  await click(page.getByRole('button', { name: 'Register' }));
  await page.getByRole('heading', { name: 'Log in' }).waitFor();
  await type(page.locator('#email'), email);
  await type(page.locator('#password'), password);
  await click(page.getByRole('button', { name: 'Log in' }));
  await page.getByRole('link', { name: 'Log out' }).waitFor();

  await click(nav('Applications'));
  await page.getByRole('heading', { name: 'Applications' }).waitFor();
  await step('empty', 'The new Applications page, before anything is added');

  const jobs = [
    { company: 'Kangaroo Point Software', title: 'Graduate software developer', work: 'Hybrid', location: 'Brisbane CBD', commute: '35', min: '75000', max: '85000', stack: 'C#, .NET, Azure, React' },
    { company: 'Northbank Health Tech', title: 'Junior full stack developer', work: 'Remote', location: '', commute: '', min: '80000', max: '95000', stack: 'React, TypeScript, Node.js' },
    { company: 'Southport Freight Systems', title: 'Integration developer', work: 'In person', location: 'Southport', commute: '70', min: '120000', max: '90000', stack: 'C#, SQL Server, Azure' },
  ];

  for (const [i, job] of jobs.entries()) {
    await addApplication(job);
    if (i === 0) await step('form-filled', 'Adding an application: every field in one form');
    await click(dialog().getByRole('button', { name: 'Save' }));
    if (i === 2) {
      // Salary min is above max on purpose: rule 2 should stop it.
      await dialog().locator('small', { hasText: 'must not be less than' }).waitFor();
      await step('rule-blocks-bad-salary', 'Rule 2 in action: salary from is more than salary to');
      await quickType(page.locator('#salaryMax'), '130000');
      await click(dialog().getByRole('button', { name: 'Save' }));
    }
    await page.locator('.app-card h3', { hasText: job.company }).waitFor();
  }
  await pause(500);
  await step('three-added', 'Three applications, newest first, with top skills on the left');

  await click(page.locator('.skill', { hasText: 'React' }));
  await page.locator('.app-card').nth(1).waitFor();
  await step('filter-react', 'Click a skill to filter: only the React jobs');
  await click(page.locator('.apps-filters .chip'));

  await quickType(page.locator('.apps-filters input[type=number]'), '45');
  await pause(800);
  await step('filter-commute', 'Max commute 45 minutes: the 70-minute in-person job is hidden, remote stays');
  await page.locator('.apps-filters input[type=number]').fill('');
  await pause(800);

  const card = page.locator('.app-card', { hasText: 'Kangaroo Point Software' });
  await card.scrollIntoViewIfNeeded();
  await choose(card.locator('select.app-status'), 'Interview');
  await card.locator('.app-facts span', { hasText: /^applied/ }).waitFor();
  await step('moved-to-interview', 'Moved to Interview: the date applied fills in, the card turns amber');

  await page.reload();
  await page.locator('.app-card').first().waitFor();
  await pause(600);
  await step('after-reload', 'After a reload: everything was saved by the API');

  await click(page.getByRole('link', { name: 'Log out' }));
  await page.getByRole('heading', { name: 'Log in' }).waitFor();
  await pause(800);

} finally {
  const video = page.video();
  await context.close();
  await browser.close();
  fs.renameSync(await video.path(), path.join(out, 'walkthrough.webm'));
  fs.writeFileSync(path.join(out, 'steps.json'), JSON.stringify(steps, null, 2));
  console.log('done', steps.length, 'steps');
}
