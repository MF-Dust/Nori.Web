// Node 24 built-in WebSocket; no package.json or ws dependency needed.
import assert from 'node:assert/strict';
const base = process.env.NORI_SMOKE_URL || 'http://127.0.0.1:8788';
const wsBase = base.replace(/^http/, 'ws');
async function socket(ticket) {
  const ws = new WebSocket(`${wsBase}/api/arcade/web/v1`, ['arcade.v1', `ticket.${ticket}`]);
  const queue = [];
  const listeners = new Set();
  let closed;
  ws.addEventListener('message', e => {
    const message = JSON.parse(e.data);
    console.log(`WS ${message.type}${message.serverId ? ` serverId=${message.serverId}` : ''}`);
    queue.push(message);
    for (const notify of listeners) notify();
  });
  ws.addEventListener('close', e => { closed = `${e.code} ${e.reason}`; console.log(`WS close ${closed}`); for (const notify of listeners) notify(); });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WebSocket open timeout')), 10000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('WebSocket upgrade failed')); }, { once: true });
  });
  assert.equal(ws.protocol, 'arcade.v1');
  console.log('WS upgrade 101 protocol=arcade.v1');
  const wait = (predicate, timeout = 10000) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { listeners.delete(check); reject(new Error('Frame timeout')); }, timeout);
    function check() {
      const index = queue.findIndex(predicate);
      if (index >= 0) { clearTimeout(timer); listeners.delete(check); resolve(queue.splice(index, 1)[0]); }
      else if (closed) { clearTimeout(timer); listeners.delete(check); reject(new Error(`Closed before expected frame: ${closed}`)); }
    }
    listeners.add(check); check();
  });
  return { ws, send: value => ws.send(JSON.stringify(value)), wait, close: () => ws.close(1000, 'smoke_complete') };
}
const live = [];
try {
  const status = await fetch(`${base}/api/entry-status`);
  console.log(`GET /api/entry-status ${status.status} ${await status.text()}`);
  const rejected = await fetch(`${base}/api/entry-status`, { headers: { Origin: 'https://attacker.invalid' } });
  console.log(`cross-origin ${rejected.status} ${await rejected.text()}`);
  assert.equal(rejected.status, 403);
  const sessionResponse = await fetch(`${base}/api/auth/get-session`);
  const session = await sessionResponse.json();
  const cookie = sessionResponse.headers.get('set-cookie').split(';')[0];
  console.log(`GET /api/auth/get-session ${sessionResponse.status} user=${session.user.id}`);
  const ticketResponse = await fetch(`${base}/api/arcade/ws-ticket`, { method: 'POST', headers: { Cookie: cookie } });
  const { ticket } = await ticketResponse.json();
  assert.ok(ticket);
  console.log(`POST /api/arcade/ws-ticket ${ticketResponse.status} ticket issued`);
  const client = await socket(ticket); live.push(client);
  client.send({ type: 'open_my_web_world' });
  const joined = await client.wait(v => v.type === 'world_joined');
  const worldId = joined.world.worldId;
  console.log(`world_joined worldId=${worldId}`);
  client.send({ type: 'ping' });
  const pong = await client.wait(v => v.type === 'pong');
  assert.equal(pong.serverId, 'nori-local-arcade');
  const chat = joined.world.mountedCartridges.find(v => v.cartridgeId === 'chat');
  client.send({ type: 'dispatch', worldId, cartridgeId: 'chat', actor: 'player', requestId: 'smoke-chat', expectedHeadVersion: chat.runtimes[0].headVersion, cmd: { type: 'playerMessage', text: 'hello' } });
  const ack = await client.wait(v => v.type === 'dispatch_ack' && v.requestId === 'smoke-chat');
  assert.equal(ack.success, true);
  await client.wait(v => v.type === 'runtime_transition' && v.cartridgeId === 'chat');
  // Draining is inline; allow the audio-mode progress fallbacks to settle.
  await new Promise(resolve => setTimeout(resolve, 2300));
  client.close();
  const reconnect = await socket(ticket); live.push(reconnect);
  reconnect.send({ type: 'join_world', worldId });
  const again = await reconnect.wait(v => v.type === 'world_joined');
  assert.equal(again.world.worldId, worldId);
  console.log(`reconnect join_world SAME worldId=${worldId}`);
  console.log('SMOKE PASS');
} catch (error) {
  console.error(`SMOKE FAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  for (const client of live) { if (client.ws.readyState === WebSocket.OPEN) client.close(); }
}
