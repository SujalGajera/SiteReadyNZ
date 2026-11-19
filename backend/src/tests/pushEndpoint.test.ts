import { isTrustedPushEndpoint } from '../utils/pushEndpoint';

describe('isTrustedPushEndpoint (stops the server being aimed at internal systems)', () => {
  it.each([
    ['Chrome, Edge and Android', 'https://fcm.googleapis.com/fcm/send/abc123'],
    ['Firefox', 'https://updates.push.services.mozilla.com/wpush/v2/abc123'],
    ['Firefox, a regional server', 'https://eu-west.push.services.mozilla.com/wpush/v2/abc123'],
    ['Safari and iOS', 'https://web.push.apple.com/QAbc123'],
    ['Windows', 'https://db5.notify.windows.com/?token=abc123'],
  ])('accepts %s', (_name, endpoint) => {
    expect(isTrustedPushEndpoint(endpoint)).toBe(true);
  });

  it.each([
    ['a local database port', 'http://localhost:27017/steal'],
    ['plain http even on a real push host', 'http://fcm.googleapis.com/fcm/send/abc123'],
    ['the cloud metadata address', 'https://169.254.169.254/latest/meta-data/'],
    ['an ordinary website', 'https://evil.example.com/collect'],
    ['a lookalike host (ends in the real name but is another site)', 'https://fcm.googleapis.com.evil.com/x'],
    ['a lookalike prefix', 'https://notfcm.googleapis.com.example.org/x'],
    ['an address with a password in it', 'https://user:pass@fcm.googleapis.com/fcm/send/abc123'],
    ['something that is not an address at all', 'not a url'],
    ['an empty string', ''],
  ])('rejects %s', (_name, endpoint) => {
    expect(isTrustedPushEndpoint(endpoint)).toBe(false);
  });

  it('ignores upper-case letters in the host name', () => {
    expect(isTrustedPushEndpoint('https://FCM.GoogleAPIs.com/fcm/send/abc123')).toBe(true);
  });
});
