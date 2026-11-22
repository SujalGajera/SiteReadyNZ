// Browser check of the bug-fix pass: explicit service worker registration, manager deleting an open check,
// finished history after its equipment is deleted, and offline still opening the app.
import puppeteer from 'puppeteer-core'
const APP = 'http://localhost:5173', API = 'http://localhost:5000', PW = 'a-good-password-1'
const run = Date.now().toString(36)
let failures = 0
const check = (name, ok, detail = '') => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== '' ? '  (' + detail + ')' : ''}`) }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const day = (o) => { const d = new Date(); d.setDate(d.getDate() + o); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-') }
const call = async (m, p, token, body) => { const r = await fetch(API + p, { method: m, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined }); const t = await r.text(); return { status: r.status, json: t ? JSON.parse(t) : null } }

const mgr = (await call('POST', '/auth/register', null, { name: 'Fix Manager', email: `fx.m.${run}@example.com`, password: PW })).json
const staff = (await call('POST', '/api/staff', mgr.token, { name: 'Fix Staff', email: `fx.s.${run}@example.com`, password: PW })).json
const aed = (await call('POST', '/api/equipment', mgr.token, { name: 'AED, open check', type: 'aed', location: 'Hall', expiryDate: day(300) })).json
const sign = (await call('POST', '/api/equipment', mgr.token, { name: 'Sign, done check', type: 'safety_sign', location: 'Stairs', expiryDate: day(300) })).json
const openCheck = (await call('POST', '/api/inspections', mgr.token, { equipmentId: aed._id, assignedStaffId: staff.id, scheduledDate: day(2) })).json
const doneCheck = (await call('POST', '/api/inspections', mgr.token, { equipmentId: sign._id, assignedStaffId: staff.id, scheduledDate: day(0) })).json
const staffToken = (await call('POST', '/auth/login', null, { email: staff.email, password: PW })).json.token
await call('POST', '/api/inspections/submit', staffToken, { inspectionId: doneCheck._id, submissionId: `fx-${run}-0001`, items: doneCheck.items.map((i) => ({ itemId: i.itemId, result: 'pass', notes: '' })) })

const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1366, height: 860 })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error' && !/401|Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 160)) })

// ---- service worker registration (now done by src/sw/registerServiceWorker.ts)
await page.goto(APP + '/login', { waitUntil: 'networkidle0' })
const html = await (await fetch(APP + '/')).text()
check('index.html no longer carries the plugin\'s own registerSW script', !html.includes('registerSW.js'))
await page.waitForFunction(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!r?.active }, { timeout: 15000 })
const swInfo = await page.evaluate(async () => { const regs = await navigator.serviceWorker.getRegistrations(); const r = regs[0]; return { count: regs.length, state: r.active?.state, script: r.active?.scriptURL, scope: r.scope } })
check('exactly one service worker is registered', swInfo.count === 1, String(swInfo.count))
check('it is active and is /sw.js with scope "/"', swInfo.state === 'activated' && swInfo.script.endsWith('/sw.js') && swInfo.scope === APP + '/', JSON.stringify(swInfo))

// ---- manager signs in through the UI
const type = async (label, v) => (await page.waitForSelector(`xpath///label[normalize-space()="${label}"]/following::input[1]`)).type(v)
await type('Email', mgr.user.email); await type('Password', PW)
await (await page.waitForSelector('xpath///button[normalize-space()="Sign in"]')).click()
await page.waitForFunction(() => location.pathname === '/equipment', { timeout: 10000 })
await page.goto(APP + '/inspections', { waitUntil: 'networkidle0' }); await wait(800)

const text = async () => page.$eval('main', (m) => m.innerText)
let t = await text()
check('the open check is listed with a Delete button', t.includes('AED, open check') && (await page.$('button[aria-label="Delete the check for AED, open check"]')) !== null)
check('the finished check has NO Delete button', (await page.$('button[aria-label="Delete the check for Sign, done check"]')) === null && t.includes('Sign, done check'))

// ---- delete with confirmation
await page.click('button[aria-label="Delete the check for AED, open check"]')
await page.waitForSelector('[role="alertdialog"]')
const dialog = await page.$eval('[role="alertdialog"]', (d) => d.innerText)
check('a confirmation dialog names the equipment', dialog.includes('Delete the check for AED, open check?'), dialog.split('\n')[0])
await (await page.waitForSelector('xpath///button[normalize-space()="Keep it"]')).click()
await wait(500)
check('"Keep it" deletes nothing', (await call('GET', '/api/inspections', mgr.token)).json.some((i) => i._id === openCheck._id))
await page.click('button[aria-label="Delete the check for AED, open check"]')
await page.waitForSelector('[role="alertdialog"]')
await (await page.waitForSelector('xpath///button[normalize-space()="Delete check"]')).click()
await page.waitForFunction(() => !document.querySelector('[role="alertdialog"]'), { timeout: 8000 })
await wait(600)
t = await text()
check('the check disappears from the page', !t.includes('AED, open check'))
check('and from the server', !(await call('GET', '/api/inspections', mgr.token)).json.some((i) => i._id === openCheck._id))

// ---- finished history survives deleting its equipment
const del = await call('DELETE', `/api/equipment/${sign._id}`, mgr.token)
check('deleting the equipment answers 204', del.status === 204, del.status)
await page.reload({ waitUntil: 'networkidle0' }); await wait(800)
t = await text()
check('the finished check is kept and shows "Removed equipment" (no crash)', t.includes('Removed equipment') && !t.includes('Something went wrong'))

// ---- offline still opens the app
const offlinePage = await browser.newPage()
await offlinePage.goto(APP + '/inspections', { waitUntil: 'networkidle0' })
await offlinePage.setOfflineMode(true)
await offlinePage.reload({ waitUntil: 'domcontentloaded' }).catch(() => undefined)
await wait(1500)
const offlineHtml = await offlinePage.content()
check('with no network the app shell still opens (served by the service worker)', offlineHtml.includes('id="root"') && !/ERR_INTERNET_DISCONNECTED/.test(offlineHtml))
check('the amber "You are offline" banner shows', (await offlinePage.$eval('body', (b) => b.innerText)).includes('You are offline'))
await offlinePage.close()

check('no browser errors', errors.length === 0, errors.join(' | '))
for (const item of (await call('GET', '/api/equipment', mgr.token)).json) await call('DELETE', `/api/equipment/${item._id}`, mgr.token)
console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILED`)
await browser.close()
