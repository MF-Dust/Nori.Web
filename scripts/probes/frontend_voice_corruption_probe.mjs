import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function verifyVoiceCorruption(page, output) {
  const result = await page.evaluate(async () => {
    const { VoiceCorruption } = await import("/runtime/voice-corruption.ts");
    const { CORRUPTION_PRESETS } =
      await import("/runtime/voice-corruption-presets.ts");
    const render = async (preset, active, moduleUrl) => {
      const rate = 32000,
        context = new OfflineAudioContext(1, rate, rate);
      const effect = new VoiceCorruption(context);
      effect.configure(preset, 0.7);
      effect.setActive(active);
      const loaded = await effect.init(moduleUrl);
      effect.output.connect(context.destination);
      const input = context.createBuffer(1, rate, rate),
        samples = input.getChannelData(0);
      for (let i = 0; i < rate; i++)
        samples[i] =
          0.08 * Math.sin((i * 2 * Math.PI * 220) / rate) +
          0.03 * Math.sin((i * 2 * Math.PI * 440) / rate);
      const source = context.createBufferSource();
      source.buffer = input;
      source.connect(effect.input);
      source.start(0);
      const buffer = await context.startRendering(),
        data = buffer.getChannelData(0);
      let energy = 0,
        difference = 0,
        peak = 0;
      for (let i = 10000; i < rate; i++) {
        if (!Number.isFinite(data[i])) throw Error("Non-finite voice output");
        energy += data[i] ** 2;
        difference += (data[i] - samples[i]) ** 2;
        peak = Math.max(peak, Math.abs(data[i]));
      }
      effect.dispose();
      return {
        preset,
        active,
        loaded,
        rms: Math.sqrt(energy / (rate - 10000)),
        difference: Math.sqrt(difference / (rate - 10000)),
        peak,
      };
    };
    const modes = [];
    for (const preset of CORRUPTION_PRESETS)
      modes.push(await render(preset, true));
    const dry = await render("unstable", false);
    const fallback = await render(
      "unstable",
      true,
      "/voice-worklet-unavailable.js",
    );

    // Actual session binding: a scene chosen before the audio gesture must be respected at unlock.
    const { NoriFrontendRuntime } =
      await import("/runtime/frontend-runtime.ts");
    const frontend = new NoriFrontendRuntime();
    const lease = frontend.scene.acquire();
    lease.set({ corruptVoice: true });
    await frontend.audio.speechRoute();
    const effect = frontend.audio.corruption;
    const activeOnUnlock = effect.active;
    await effect.init();
    frontend.audio.sync({
      masterVolume: 50,
      musicVolume: 10,
      sfxVolume: 80,
      voiceVolume: 20,
      isMuted: false,
      musicMuted: false,
      sfxMuted: false,
      voiceMuted: false,
      spatialVoice: false,
    });
    const voiceGain = window.audioProbe.gain(effect.output);
    frontend.speech.reset();
    const replacedOnReset =
      frontend.audio.corruption !== effect && !effect.workletReady;
    await frontend.audio.corruption.init();
    lease.release();
    const released = !frontend.audio.corruption.active;
    const again = frontend.scene.acquire();
    again.set({ corruptVoice: true });
    frontend.scene.reset();
    const reset = !frontend.audio.corruption.active;
    const context = frontend.audio.context;
    frontend.dispose();
    return {
      modes,
      dry,
      fallback,
      activeOnUnlock,
      released,
      reset,
      replacedOnReset,
      voiceGain,
      disposed: context.state === "closed",
    };
  });
  assert.equal(result.modes.length, 6);
  for (const mode of result.modes) {
    assert.equal(mode.loaded, true, `${mode.preset} source worklet must load`);
    assert.ok(
      mode.rms > 0.001 && mode.difference > 0.001,
      `${mode.preset} must transform audio`,
    );
    assert.ok(mode.peak < 2, `${mode.preset} must remain bounded`);
  }
  assert.equal(result.dry.loaded, true);
  assert.ok(result.dry.difference < 1e-6, "bypass must preserve dry speech");
  assert.equal(result.fallback.loaded, false);
  assert.ok(
    result.fallback.rms > 0.001 && result.fallback.difference > 0.001,
    "native fallback must remain audible",
  );
  assert.ok(
    Math.abs(result.voiceGain - 0.1) < 1e-6,
    "voice and master volume apply exactly once after effects",
  );
  for (const key of [
    "activeOnUnlock",
    "released",
    "reset",
    "replacedOnReset",
    "disposed",
  ])
    assert.equal(result[key], true, key);
  await writeFile(
    resolve(output, "voice-corruption.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(
    "Voice corruption probe passed: six real worklet modes, native fallback, dry speech and scene lifecycle",
  );
}
