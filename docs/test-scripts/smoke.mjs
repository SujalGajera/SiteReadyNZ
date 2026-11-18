// Regression smoke test after Phase 5: the earlier features still work, and sign-out never hangs.
import puppeteer from 'puppeteer-core'
const APP = 'http://localhost:5173', API = 'http://localhost:5000', PW = 'a-good-password-1'
const run = Date.now().toString(36)
let failures = 0
const check = (name, ok, detail = '') => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== '' ? '  (' + detail + ')' : ''}`) }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const day = (o) => { const d = new Date(); d.setDate(d.getDate() + o); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-') }
const call = async (m, p, token, body) => { const r = await fetch(API + p, { method: m, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined }); const t = await r.text(); return { status: r.status, json: t ? JSON.parse(t) : null } }

const mgr = (await call('POST', '/auth/register', null, { name: 'Smoke Manager', email: `sm.m.${run}@example.com`, password: PW })).json
const staff = (await call('POST', '/api/staff', mgr.token, { name: 'Smoke Staff', email: `sm.s.${run}@example.com`, password: PW })).json
const eq = (await call('POST', '/api/equipment', mgr.token, { name: 'Extinguisher, smoke', type: 'fire_extinguisher', location: 'Lab', expiryDate: day(300), lastInspectedAt: new Date(Date.now() - 50 * 86400000).toISOString() })).json
check('equipment starts as "check overdue"', eq.status === 'overdue', eq.status)
const insp = (await call('POST', '/api/inspections', mgr.token, { equipmentId: eq._id, assignedStaffId: staff.id, scheduledDate: day(0) })).json
const staffToken = (await call('POST', '/auth/login', null, { email: staff.email, password: PW })).json.token
const submit = await call('POST', '/api/inspections/submit', staffToken, { inspectionId: insp._id, submissionId: `smoke-${run}-0001`, items: insp.items.map((i) => ({ itemId: i.itemId, result: 'pass', notes: '' })) })
check('staff can submit a checklist (200)', submit.status === 200, submit.status)
check('equipment is "ok" after the inspection', (await call('GET', `/api/equipment/${eq._id}`, mgr.token)).json.status === 'ok')
const sweep = await call('POST', '/api/push/run-checks', mgr.token)
check('run-checks ignores a completed inspection', sweep.status === 200 && sweep.json.reminders === 0 && sweep.json.lateAlerts === 0, JSON.stringify(sweep.json))

const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1366, height: 860 })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error' && !/401|Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 160)) })
await page.goto(APP + '/login', { waitUntil: 'networkidle0' })
const type = async (label, v) => (await page.waitForSelector(`xpath///label[normalize-space()="${label}"]/following::input[1]`)).type(v)
await type('Email', staff.email); await type('Password', PW)
await (await page.waitForSelector('xpath///button[normalize-space()="Sign in"]')).click()
await page.waitForFunction(() => location.pathname === '/inspections', { timeout: 10000 }); await wait(1200)
check('staff signs in and lands on /inspections', true)
check('the notification card is shown in the sidebar', (await page.$eval('section[aria-label="Notifications"]', (s) => s.innerText).catch(() => '')).includes('Get reminders'))
const started = Date.now()
await page.click('button[aria-label="Sign out"]')
await page.waitForFunction(() => location.pathname === '/login', { timeout: 12000 })
check('sign-out completes promptly and returns to /login', Date.now() - started < 8000, `${Date.now() - started} ms`)
await page.goto(APP + '/inspections', { waitUntil: 'networkidle0' })
check('after sign-out the app is protected again', new URL(page.url()).pathname === '/login')
check('no browser errors', errors.length === 0, errors.join(' | '))
for (const item of (await call('GET', '/api/equipment', mgr.token)).json) await call('DELETE', `/api/equipment/${item._id}`, mgr.token)
console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILED`)
await browser.close()
