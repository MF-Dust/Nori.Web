import type { Live2DModel } from "./engine.js";
import type { ChatRuntimeController } from "../apps/chat-runtime";
import type { SpeechPlayer } from "../runtime/speech-player";
import type { NoriSceneStore } from "../state/nori-scene";
import {
  NoriEmotionObserver,
  NoriExpressionController,
} from "./expression-controller";
import { NoriIdleController, noriIdleFromFacts } from "./idle-controller";

export function bindNoriModel(options: {
  model: Live2DModel;
  conversation: ChatRuntimeController;
  speech: SpeechPlayer;
  scene: NoriSceneStore;
  facts(): ReadonlySet<string>;
  exclusive(): boolean;
  host: HTMLElement;
}) {
  const { model, conversation, speech, scene, host } = options;
  let sleeping = false,
    epoch = conversation.snapshot().presentationEpoch;
  const expressions = new NoriExpressionController((previous, next) => {
    if (previous) model.removeExpression(previous);
    if (next) model.addExpression(next);
    host.dataset.noriExpression = next ?? "neutral";
  });
  const observer = new NoriEmotionObserver();
  const idle = new NoriIdleController((step, sleep) => {
    sleeping = sleep;
    if (!sleep) model.setIdleSequence(step);
    model.startMotion({ steps: step });
  });
  let texture: string | null | undefined,
    rest: boolean | undefined,
    lipEnabled: boolean | undefined;
  const update = () => {
    const state = scene.snapshot(),
      chat = conversation.snapshot();
    if (state.noriTexture !== texture) {
      texture = state.noriTexture;
      model.setTextureVariant(texture);
    }
    if (state.noriRestPose !== rest) {
      rest = state.noriRestPose;
      model.setRestPose(rest);
    }
    const idleState = noriIdleFromFacts(options.facts());
    const nextLipEnabled = idleState !== "kneel" && idleState !== "kneelCalm";
    if (lipEnabled !== nextLipEnabled) {
      lipEnabled = nextLipEnabled;
      model.setPluginEnabled("lipSync", lipEnabled);
    }
    host.dataset.noriIdle = idle.update(
      idleState,
      state.noriSleep,
      speech.level(),
      state.active ||
        options.exclusive() ||
        chat.phase === "executing" ||
        !chat.connected,
    );
    host.dataset.noriThinking = String(
      chat.connected && chat.phase === "executing",
    );
    host.dataset.noriTexture = texture ?? "default";
    host.dataset.noriRestPose = String(rest);
    host.dataset.noriLipSync = String(lipEnabled);
    expressions.suppress(
      state.active || state.noriSleep || sleeping || !chat.connected,
    );
  };
  const observe = () => {
    const state = conversation.snapshot();
    if (state.presentationEpoch !== epoch) {
      epoch = state.presentationEpoch;
      expressions.reset();
      idle.activity();
    }
    update();
    observer.observe(epoch, state.lines, (expression) => {
      idle.activity();
      update();
      expressions.request(expression);
    });
  };
  const unsubscribeChat = conversation.subscribe(observe);
  const unsubscribeSpeech = speech.subscribe((event) => {
    if (event.type === "started") {
      idle.activity();
      update();
      expressions.blockStarted(`${event.operationId}:${event.blockId}`);
    } else if (event.type === "done")
      expressions.blockFinished(`${event.operationId}:${event.blockId}`);
    else if (event.type === "cut")
      expressions.cut(event.operationId, event.blockId);
    else expressions.reset();
  });
  const unsubscribeScene = scene.subscribe(update);
  const activity = () => idle.activity();
  for (const name of ["mousemove", "pointerdown", "keydown"])
    window.addEventListener(name, activity, { passive: true });
  const timer = setInterval(update, 200);
  observe();
  return () => {
    clearInterval(timer);
    unsubscribeChat();
    unsubscribeSpeech();
    unsubscribeScene();
    expressions.dispose();
    for (const name of ["mousemove", "pointerdown", "keydown"])
      window.removeEventListener(name, activity);
  };
}
