/** Installed only by the browser smoke: observe the real WebAudio graph. */
export function installAudioProbe() {
  const edges = new Map();
  const connect = AudioNode.prototype.connect;
  const disconnect = AudioNode.prototype.disconnect;
  AudioNode.prototype.connect = function (...args) {
    const result = connect.apply(this, args);
    if (args[0] instanceof AudioNode) edges.set(this, args[0]);
    return result;
  };
  AudioNode.prototype.disconnect = function (...args) {
    const result = disconnect.apply(this, args);
    edges.delete(this);
    return result;
  };
  const contexts = [],
    starts = [],
    media = [];
  const Native = AudioContext;
  function gain(node) {
    let level = 1;
    for (let i = 0; i < 20; i++) {
      if (node instanceof AudioDestinationNode) return level;
      if (node instanceof GainNode) level *= node.gain.value;
      node = edges.get(node);
      if (!node) return 0;
    }
    throw Error("audio graph cycle");
  }
  window.AudioContext = class extends Native {
    constructor(...args) {
      super(...args);
      contexts.push(this);
    }
    createBufferSource() {
      const node = super.createBufferSource(),
        start = node.start;
      node.start = function (...args) {
        starts.push({
          node,
          gain: gain(node),
          context: node.context,
          loop: node.loop,
        });
        return start.apply(node, args);
      };
      return node;
    }
    createMediaElementSource(element) {
      const node = super.createMediaElementSource(element);
      media.push(node);
      return node;
    }
  };
  window.audioProbe = { contexts, starts, media, gain };
}

export async function verifyPodcastMixer(page) {
  return page.evaluate(async () => {
    const { AudioMixer } = await import("/runtime/audio-mixer.ts");
    const { BrowserPodcastRuntime } =
      await import("/apps/browser-page-runtime.ts");
    const mixer = new AudioMixer();
    const settings = {
      masterVolume: 50,
      musicVolume: 75,
      sfxVolume: 40,
      voiceVolume: 100,
      isMuted: false,
      musicMuted: false,
      sfxMuted: false,
      voiceMuted: false,
      spatialVoice: false,
    };
    mixer.sync(settings);
    const podcast = new BrowserPodcastRuntime((element) =>
      mixer.connectMediaElement(element),
    );
    const src = "/webAssets/concord/jack_bgm.mp3";
    try {
      const played = await podcast.invoke(
        "podcast.play",
        { src },
        "podcast-test",
      );
      const node = window.audioProbe.media.at(-1);
      if (!node) throw Error("podcast did not enter the audio graph");
      const gain = window.audioProbe.gain(node);
      mixer.sync({ ...settings, sfxMuted: true });
      const muted = window.audioProbe.gain(node);
      await podcast.invoke("podcast.rate", { src, rate: 1.5 }, "podcast-test");
      const rate = podcast.snapshot().rate;
      podcast.releaseOwner("podcast-test");
      const paused = podcast.snapshot().paused;
      podcast.dispose();
      mixer.dispose();
      return {
        played,
        gain,
        muted,
        rate,
        paused,
        disconnected: window.audioProbe.gain(node) === 0,
        closed: node.context.state === "closed",
      };
    } finally {
      podcast.dispose();
      mixer.dispose();
    }
  });
}
