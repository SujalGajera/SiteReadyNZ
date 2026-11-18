// Phase 5 API checks: keys, subscribing, permissions, workspace limits and the unsafe-address defence.
import crypto from 'node:crypto'
const BASE = 'http://localhost:5000'
const run = Date.now().toString(36)
let failures = 0
const check = (name, ok, detail = '') => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== '' ? '  (' + detail + ')' : ''}`) }
async function call(method, path, { token, body } = {}) {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const t = await r.text()
  return { status: r.status, json: t ? JSON.parse(t) : null }
}
const PW = 'a-good-password-1'
const b64url = (bytes) => Buffer.from(bytes).toString('base64url')

// A well-formed subscription for a made-up device. FCM will refuse to deliver to it, which is what we want to see handled.
const fakeSubscription = () => ({
  endpoint: `https://fcm.googleapis.com/fcm/send/fake-${crypto.randomBytes(24).toString('hex')}`,
  keys: { p256dh: b64url(crypto.randomBytes(65)), auth: b64url(crypto.randomBytes(16)) },
})

const mgr = (await call('POST', '/auth/register', { body: { name: 'Push Manager', email: `push.m.${run}@example.com`, password: PW } })).json
const M = mgr.token
const tane = (await call('POST', '/api/staff', { token: M, body: { name: 'Tane', email: `push.s.${run}@example.com`, password: PW } })).json
const S = (await call('POST', '/auth/login', { body: { email: tane.email, password: PW } })).json.token
const stranger = (await call('POST', '/auth/register', { body: { name: 'Stranger', email: `push.x.${run}@example.com`, password: PW } })).json

// ---- public key
let r = await call('GET', '/api/push/public-key', { token: S })
check('GET /api/push/public-key -> 200 with a public key', r.status === 200 && typeof r.json.publicKey === 'string' && r.json.publicKey.length === 87, `${r.status} ${r.json?.publicKey?.length} chars`)
check('  the private key is never in the answer', !JSON.stringify(r.json).includes('privateKey'))
r = await call('GET', '/api/push/public-key')
check('GET /api/push/public-key without login -> 401', r.status === 401, r.status)

// ---- subscribing, and the defence against unsafe addresses
const good = fakeSubscription()
r = await call('POST', '/api/push/subscribe', { token: S, body: good })
check('POST /api/push/subscribe (valid push-service address) -> 200', r.status === 200, r.status)
r = await call('POST', '/api/push/subscribe', { token: S, body: good })
check('subscribing the same device again -> 200 (idempotent)', r.status === 200, r.status)
for (const [label, endpoint] of [
  ['an internal address (http://localhost:27017)', 'http://localhost:27017/steal'],
  ['a cloud metadata address', 'https://169.254.169.254/latest/meta-data/'],
  ['an https address on some other website', 'https://evil.example.com/collect'],
  ['an address that only looks like Google (fcm.googleapis.com.evil.com)', 'https://fcm.googleapis.com.evil.com/x'],
  ['an address with a password in it', 'https://user:pass@fcm.googleapis.com/fcm/send/abcdefghijklmnop'],
]) {
  r = await call('POST', '/api/push/subscribe', { token: S, body: { ...fakeSubscription(), endpoint } })
  check(`subscribe with ${label} -> 400`, r.status === 400, r.status)
}
r = await call('POST', '/api/push/subscribe', { token: S, body: { endpoint: good.endpoint } })
check('subscribe without encryption keys -> 400', r.status === 400, r.status)
r = await call('POST', '/api/push/subscribe', { body: good })
check('subscribe without login -> 401', r.status === 401, r.status)

// ---- sending
r = await call('POST', '/api/push/send', { token: S, body: { targetUserId: tane.id, title: 'x', body: 'y' } })
check('POST /api/push/send as staff -> 403', r.status === 403, r.status)
r = await call('POST', '/api/push/send', { token: M, body: { targetUserId: tane.id, title: 'Check due', body: 'Extinguisher, hall', url: '/inspections' } })
check('POST /api/push/send (manager, own staff) -> 200', r.status === 200, `${r.status} ${JSON.stringify(r.json)}`)
check('  reports 1 registered device; the fake one is refused or removed, not delivered', r.json?.devices === 1 && r.json?.delivered === 0 && r.json.removed + r.json.failed === 1, JSON.stringify(r.json))
r = await call('POST', '/api/push/send', { token: M, body: { targetUserId: mgr.user.id, title: 'Note to self', body: 'No devices here' } })
check('send to a person with no devices -> 200 with devices 0 and a plain message', r.status === 200 && r.json?.devices === 0 && /not turned notifications on/.test(r.json?.message), JSON.stringify(r.json))
r = await call('POST', '/api/push/send', { token: M, body: { targetUserId: stranger.user.id, title: 'x', body: 'y' } })
check('send to someone in another business -> 404', r.status === 404, r.status)
r = await call('POST', '/api/push/send', { token: stranger.token, body: { targetUserId: tane.id, title: 'x', body: 'y' } })
check('another business sending to our staff -> 404', r.status === 404, r.status)
r = await call('POST', '/api/push/send', { token: M, body: { targetUserId: tane.id, title: '', body: 'y' } })
check('send without a title -> 400', r.status === 400, r.status)
r = await call('POST', '/api/push/send', { token: M, body: { targetUserId: tane.id, title: 'x', body: 'y', url: 'https://evil.example.com' } })
check('send with a link to another website -> 400', r.status === 400, r.status)
r = await call('POST', '/api/push/send', { token: M, body: { targetUserId: 'nope', title: 'x', body: 'y' } })
check('send with a malformed user id -> 400', r.status === 400, r.status)

// ---- a shared phone: the same device moves to whoever subscribes last
r = await call('POST', '/api/push/subscribe', { token: M, body: good })
check('the same device subscribing as a different person -> 200', r.status === 200, r.status)
r = await call('POST', '/api/push/send', { token: M, body: { targetUserId: tane.id, title: 'x', body: 'y' } })
check('  the first person no longer has that device', r.json?.devices === 0, r.json?.devices)

// ---- unsubscribing
r = await call('POST', '/api/push/unsubscribe', { token: M, body: { endpoint: good.endpoint } })
check('POST /api/push/unsubscribe -> 204', r.status === 204, r.status)
r = await call('POST', '/api/push/send', { token: M, body: { targetUserId: mgr.user.id, title: 'x', body: 'y' } })
check('  afterwards the device is gone (0 devices)', r.json?.devices === 0, r.json?.devices)

// ---- the automatic checks
r = await call('POST', '/api/push/run-checks', { token: M })
check('POST /api/push/run-checks (manager) -> 200 with counts', r.status === 200 && typeof r.json.reminders === 'number' && typeof r.json.lateAlerts === 'number', JSON.stringify(r.json))
r = await call('POST', '/api/push/run-checks', { token: S })
check('POST /api/push/run-checks as staff -> 403', r.status === 403, r.status)

console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILED`)
