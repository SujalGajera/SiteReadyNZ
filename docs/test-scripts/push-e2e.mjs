// Phase 5 end-to-end in real Chrome: permission, subscription, real delivery through Google's push
// service, the automatic reminder and overdue alert, once-only delivery, turning off, and "blocked".
import puppeteer from 'puppeteer-core'

const APP = 'http://localhost:5173', API = 'http://localhost:5000', PW = 'a-good-password-1'
const run = Date.now().toString(36)
let failures = 0
const check = (name, ok, detail = '') => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== '' ? '  (' + detail + ')' : ''}`) }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const day = (o) => { const d = new Date(); d.setDate(d.getDate() + o); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-') }
const call = async (m, p, token, body) => { const r = await fetch(API + p, { method: m, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined }); const t = await r.text(); return t ? JSON.parse(t) : null }

const mgr = await call('POST', '/auth/register', null, { name: 'Push Manager', email: `pe.m.${run}@example.com`, password: PW })
const staff = await call('POST', '/api/staff', mgr.token, { name: 'Tāne Walker', email: `pe.s.${run}@example.com`, password: PW })
const eq1 = await call('POST', '/api/equipment', mgr.token, { name: 'AED, main hall', type: 'aed', location: 'Main hall', expiryDate: day(200) })
const eq2 = await call('POST', '/api/equipment', mgr.token, { name: 'First aid kit, kitchen', type: 'first_aid', location: 'Kitchen', expiryDate: day(200) })
const dueTomorrow = await call('POST', '/api/inspections', mgr.token, { equipmentId: eq1._id, assignedStaffId: staff.id, scheduledDate: day(1) })
const veryLate = await call('POST', '/api/inspections', mgr.token, { equipmentId: eq2._id, assignedStaffId: staff.id, scheduledDate: day(-3) })

const browsers = []
const problems = []
// Chrome does not allow push in incognito-style contexts, so each person gets their own normal browser window
async function openAs(email, permission) {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new' })
  browsers.push(browser)
  const context = browser.defaultBrowserContext()
  await context.overridePermissions(APP, permission === 'granted' ? ['notifications'] : [])
  const page = await browser.newPage()
  await page.setViewport({ width: 1366, height: 860 })
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message))
  await page.goto(APP + '/login', { waitUntil: 'networkidle0' })
  const type = async (label, v) => { const i = await page.waitForSelector(`xpath///label[normalize-space()="${label}"]/following::input[1]`); await i.type(v) }
  await type('Email', email); await type('Password', PW)
  await (await page.waitForSelector('xpath///button[normalize-space()="Sign in"]')).click()
  await page.waitForFunction(() => location.pathname !== '/login', { timeout: 10000 })
  await page.evaluate(() => navigator.serviceWorker.ready); await page.reload({ waitUntil: 'networkidle0' }); await wait(1200)
  return page
}
const cardText = (page) => page.$eval('section[aria-label="Notifications"]', (s) => s.innerText).catch(() => '')
const shown = (page) => page.evaluate(async () => (await (await navigator.serviceWorker.ready).getNotifications()).map((n) => ({ title: n.title, body: n.body, url: n.data?.url, tag: n.tag })))
async function waitForNotification(page, titlePart, ms = 25000) {
  const end = Date.now() + ms
  while (Date.now() < end) { const list = await shown(page); const hit = list.find((n) => n.title.includes(titlePart)); if (hit) return hit; await wait(500) }
  return null
}

// ================= staff turns reminders on
const staffPage = await openAs(staff.email, 'granted')
let card = await cardText(staffPage)
check('staff sees "Get reminders" with a Turn on button', card.includes('Get reminders') && card.includes('Turn on reminders'), card.replace(/\n/g, ' | '))
await (await staffPage.waitForSelector('xpath///button[normalize-space()="Turn on reminders"]')).click()
await staffPage.waitForFunction(() => document.querySelector('section[aria-label="Notifications"]')?.innerText.includes('Reminders are on'), { timeout: 90000 }).catch(() => {})
card = await cardText(staffPage)
check('after allowing, the card says "Reminders are on"', card.includes('Reminders are on'), card.replace(/\n/g, ' | '))
const sub = await staffPage.evaluate(async () => { const s = await (await navigator.serviceWorker.ready).pushManager.getSubscription(); return s ? { endpoint: new URL(s.endpoint).hostname, hasKeys: !!s.getKey('p256dh') } : null })
check('the browser holds a real push subscription (from Google\'s push service)', !!sub && sub.endpoint === 'fcm.googleapis.com' && sub.hasKeys, JSON.stringify(sub))
await staffPage.screenshot({ path: 'push-1-staff-on.png' })

// ================= manager sends a message; it really arrives
const sent = await call('POST', '/api/push/send', mgr.token, { targetUserId: staff.id, title: 'Hello from your manager', body: 'Please check the AED today.', url: `/inspections/${dueTomorrow._id}` })
check('server: the push service accepted the message (delivered 1)', sent.devices === 1 && sent.delivered === 1, JSON.stringify(sent))
const arrived = await waitForNotification(staffPage, 'Hello from your manager')
check('the notification arrived in the browser with the right text and link', !!arrived && arrived.body === 'Please check the AED today.' && arrived.url === `/inspections/${dueTomorrow._id}`, JSON.stringify(arrived))

// ================= the manager's own device, for the overdue alert
const mgrPage = await openAs(mgr.user.email, 'granted')
await (await mgrPage.waitForSelector('xpath///button[normalize-space()="Turn on reminders"]')).click()
await mgrPage.waitForFunction(() => document.querySelector('section[aria-label="Notifications"]')?.innerText.includes('Reminders are on'), { timeout: 90000 }).catch(() => {})
check('manager can turn reminders on too (card mentions overdue checks)', (await cardText(mgrPage)).includes('more than a day late'), (await cardText(mgrPage)).replace(/\n/g, ' | '))

// ================= automatic checks
const sweep = await call('POST', '/api/push/run-checks', mgr.token)
check('run-checks: 1 reminder to staff and 1 late alert to the manager', sweep.reminders === 1 && sweep.lateAlerts === 1, JSON.stringify(sweep))
const reminder = await waitForNotification(staffPage, 'Check due tomorrow')
check('staff received "Check due tomorrow" for the AED, linking to that checklist', !!reminder && reminder.body.includes('AED, main hall') && reminder.url === `/inspections/${dueTomorrow._id}`, JSON.stringify(reminder))
const lateAlert = await waitForNotification(mgrPage, 'Inspection is overdue')
check('manager received "Inspection is overdue" naming the person and the equipment', !!lateAlert && lateAlert.body.includes('Tāne Walker') && lateAlert.body.includes('First aid kit, kitchen'), JSON.stringify(lateAlert))
const again = await call('POST', '/api/push/run-checks', mgr.token)
check('running the checks again sends nothing (each person is told only once)', again.reminders === 0 && again.lateAlerts === 0, JSON.stringify(again))

// ================= a finished inspection is never nagged about
const lateStaffToken = (await call('POST', '/auth/login', null, { email: staff.email, password: PW })).token
const mine = await call('GET', `/api/inspections/assigned/${staff.id}`, lateStaffToken)
const items = mine.find((i) => i._id === veryLate._id).items.map((i) => ({ itemId: i.itemId, result: 'pass', notes: '' }))
await call('POST', '/api/inspections/submit', lateStaffToken, { inspectionId: veryLate._id, submissionId: `done-${run}-0001`, items })
const eq3 = await call('POST', '/api/equipment', mgr.token, { name: 'Sign, stairwell', type: 'safety_sign', location: 'Stairwell', expiryDate: day(200) })
const done = await call('POST', '/api/inspections', mgr.token, { equipmentId: eq3._id, assignedStaffId: staff.id, scheduledDate: day(-5) })
const doneItems = (await call('GET', `/api/inspections/assigned/${staff.id}`, lateStaffToken)).find((i) => i._id === done._id).items.map((i) => ({ itemId: i.itemId, result: 'pass', notes: '' }))
await call('POST', '/api/inspections/submit', lateStaffToken, { inspectionId: done._id, submissionId: `done-${run}-0002`, items: doneItems })
const afterDone = await call('POST', '/api/push/run-checks', mgr.token)
check('a completed inspection that was overdue triggers no alert', afterDone.lateAlerts === 0 && afterDone.reminders === 0, JSON.stringify(afterDone))

// ================= tapping the notification opens the right page
const clickResult = await staffPage.evaluate(async (path) => {
  const reg = await navigator.serviceWorker.ready
  const target = (await reg.getNotifications()).find((n) => n.data?.url === path)
  return !!target
}, `/inspections/${dueTomorrow._id}`)
check('the notification carries a deep link to the checklist (used when it is tapped)', clickResult)

// ================= turning off
await staffPage.screenshot({ path: 'push-2-notifications-arrived.png' })
await (await staffPage.waitForSelector('xpath///button[normalize-space()="Turn off"]')).click()
await staffPage.waitForFunction(() => document.querySelector('section[aria-label="Notifications"]')?.innerText.includes('Get reminders'), { timeout: 10000 }).catch(() => {})
check('turning off returns the card to "Get reminders"', (await cardText(staffPage)).includes('Get reminders'))
const afterOff = await call('POST', '/api/push/send', mgr.token, { targetUserId: staff.id, title: 'x', body: 'y' })
check('server forgot the device (0 devices)', afterOff.devices === 0, JSON.stringify(afterOff))
const subAfterOff = await staffPage.evaluate(async () => !!(await (await navigator.serviceWorker.ready).pushManager.getSubscription()))
check('the browser subscription is removed too', subAfterOff === false)

// ================= graceful: permission refused
const blockedPage = await openAs(staff.email, 'denied')
const permission = await blockedPage.evaluate(() => Notification.permission)
const blockedCard = await cardText(blockedPage)
if (permission === 'denied') {
  check('when notifications are blocked the card explains how to allow them', blockedCard.includes('Reminders are blocked') && blockedCard.includes('settings'), blockedCard.replace(/\n/g, ' | ').slice(0, 90))
} else {
  // In headless Chrome the default can be "default" (not asked). Asking and being refused must not break the app.
  const click = await blockedPage.$('xpath///button[normalize-space()="Turn on reminders"]')
  await click?.click(); await wait(1500)
  const after = await cardText(blockedPage)
  check('refusing the permission prompt leaves the app working with a clear card', !!after && (await blockedPage.evaluate(() => document.body.innerText)).includes('Inspections'), after.replace(/\n/g, ' | ').slice(0, 90))
}
await blockedPage.screenshot({ path: 'push-3-blocked.png' })

// ---- cleanup
for (const item of await call('GET', '/api/equipment', mgr.token)) await call('DELETE', `/api/equipment/${item._id}`, mgr.token)
console.log('\nBROWSER ERRORS:', problems.length ? '\n' + [...new Set(problems)].join('\n') : 'none')
console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILED`)
for (const b of browsers) await b.close()


