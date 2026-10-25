import { WebRtcLink, webRtcConfig } from "../../../frontend-src/multiplayer/webrtc-transport";
import { DEFAULT_MULTIPLAYER_SETTINGS } from "../../../frontend-src/state/multiplayer-settings-store";
import type { PeerLink } from "../../../frontend-src/multiplayer/transport";

function opened(link: PeerLink): Promise<void> {
  if (link.state === "open") return Promise.resolve();
  return new Promise((resolve, reject) => link.onState((state) => {
    if (state === "open") resolve();
    else if (state === "failed" || state === "closed") reject(new Error(`link ${state}`));
  }));
}

/** Real RTCPeerConnection loopback through the copy/paste code exchange. */
async function loopback() {
  // No STUN/TURN: two peers in one browser connect over host candidates.
  const config = webRtcConfig({ ...DEFAULT_MULTIPLAYER_SETTINGS, stunUrls: "" });
  const host = await WebRtcLink.offer(config, { game: "chess", room: "probe" });
  const invite = await WebRtcLink.decode<{ game: string }>(host.code);
  const guest = await WebRtcLink.answer(config, invite, invite.meta);
  await host.link.accept(await WebRtcLink.decode(guest.code));
  await Promise.all([opened(host.link), opened(guest.link)]);
  const received = new Promise<string>((resolve) => guest.link.onMessage(resolve));
  host.link.send(JSON.stringify({ t: "ping", at: 1 }));
  const message = await received;
  const result = { message, hostRoute: host.link.route, guestRoute: guest.link.route, inviteLength: host.code.length };
  host.link.close();
  guest.link.close();
  return result;
}

(window as unknown as { loopback: typeof loopback }).loopback = loopback;
