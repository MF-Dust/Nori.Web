class c extends AudioWorkletProcessor {
  currentQueue = [];
  pendingQueue = [];
  readIndex = 0;
  frameCount = 0;
  currentOperationId = null;
  currentMessageId = null;
  currentBlockId = null;
  sawComplete = !1;
  sentTtsComplete = !1;
  starvedQuanta = 0;
  rebuffering = !1;
  rebufferHeldQuanta = 0;
  rate = 1;
  constructor() {
    (super(),
      (this.port.onmessage = (t) => {
        const { data: e } = t;
        if (e?.type === "samples" && e.samples instanceof Float32Array) {
          this.enqueueChunk({
            samples: e.samples,
            operationId: typeof e.operationId == "string" ? e.operationId : void 0,
            messageId: typeof e.messageId == "string" ? e.messageId : void 0,
            blockId: typeof e.blockId == "number" ? e.blockId : void 0,
            isComplete: e.isComplete === !0,
          });
          return;
        }
        if (e?.type === "interrupt" && typeof e.messageId == "string") {
          this.handleInterrupt(e.messageId);
          return;
        }
        if (e?.type === "cut" && typeof e.operationId == "string" && typeof e.blockId == "number") {
          this.handleCut(e.operationId, e.blockId);
          return;
        }
        e?.type === "rate" &&
          typeof e.value == "number" &&
          (this.rate = Number.isFinite(e.value) ? Math.min(4, Math.max(0.25, e.value)) : 1);
      }));
  }
  hasBlockInfo(t) {
    return typeof t.messageId == "string" && typeof t.blockId == "number";
  }
  isCurrentBlockEntry(t) {
    return (
      this.hasBlockInfo(t) &&
      this.currentMessageId === t.messageId &&
      this.currentBlockId === t.blockId
    );
  }
  enqueueChunk(t) {
    if (((this.sentTtsComplete = !1), this.isCurrentBlockEntry(t))) {
      this.currentQueue.push(t);
      return;
    }
    this.pendingQueue.push(t);
  }
  promoteNextBlock() {
    if (
      this.currentMessageId !== null ||
      this.currentBlockId !== null ||
      this.pendingQueue.length === 0
    )
      return;
    const t = this.pendingQueue[0];
    if (!this.hasBlockInfo(t)) return;
    ((this.currentMessageId = t.messageId ?? null),
      (this.currentBlockId = t.blockId ?? null),
      (this.currentOperationId = t.operationId ?? null),
      (this.currentQueue = []),
      (this.starvedQuanta = 0),
      (this.rebuffering = !1),
      (this.rebufferHeldQuanta = 0),
      this.currentMessageId !== null &&
        this.currentBlockId !== null &&
        this.port.postMessage({
          type: "block_started",
          ...(this.currentOperationId !== null ? { operationId: this.currentOperationId } : {}),
          messageId: this.currentMessageId,
          blockId: this.currentBlockId,
        }));
    const e = [];
    for (const r of this.pendingQueue)
      this.isCurrentBlockEntry(r) ? this.currentQueue.push(r) : e.push(r);
    this.pendingQueue = e;
  }
  process(t, e) {
    const r = e[0][0],
      o = r.length;
    let i = 0;
    for (; i < o;) {
      (this.currentMessageId === null || this.currentBlockId === null) && this.promoteNextBlock();
      let u,
        a = !1;
      if (this.currentMessageId !== null && this.currentBlockId !== null) {
        if (((u = this.currentQueue[0]), (a = !0), !u)) {
          if (
            (this.rebuffering ||
              ((this.rebuffering = !0),
              (this.rebufferHeldQuanta = 0),
              this.postBlockDiag("rebuffer_hold")),
            (this.starvedQuanta += 1),
            this.starvedQuanta >= 2500)
          ) {
            this.clearCurrentBlock("starvation_drop");
            continue;
          }
          for (let s = i; s < o; s++) r[s] = 0;
          break;
        }
        if (((this.starvedQuanta = 0), this.rebuffering))
          if (this.currentBlockCushionReady())
            ((this.rebuffering = !1),
              (this.rebufferHeldQuanta = 0),
              this.postBlockDiag("rebuffer_resume"));
          else if (((this.rebufferHeldQuanta += 1), this.rebufferHeldQuanta >= 750))
            ((this.rebuffering = !1),
              (this.rebufferHeldQuanta = 0),
              this.postBlockDiag("rebuffer_forced_resume"));
          else {
            for (let s = i; s < o; s++) r[s] = 0;
            break;
          }
      } else {
        if (((u = this.pendingQueue[0]), !u)) {
          for (let s = i; s < o; s++) r[s] = 0;
          break;
        }
        if (this.hasBlockInfo(u)) {
          this.promoteNextBlock();
          continue;
        }
      }
      const n = u.samples;
      if (this.rate === 1) {
        const s = this.readIndex | 0,
          h = n.length - s,
          l = Math.min(h, o - i);
        (r.set(n.subarray(s, s + l), i), (i += l), (this.readIndex = s + l));
      } else
        for (; i < o && this.readIndex < n.length;) {
          const s = this.readIndex | 0,
            h = this.readIndex - s,
            l = n[s],
            d = s + 1 < n.length ? n[s + 1] : l;
          ((r[i] = l + (d - l) * h), i++, (this.readIndex += this.rate));
        }
      if (this.readIndex >= n.length)
        if (((this.readIndex = 0), a)) {
          const s = this.currentQueue.shift();
          s &&
            s.isComplete &&
            this.hasBlockInfo(s) &&
            (this.port.postMessage({
              type: "block_finished",
              ...(typeof s.operationId == "string" ? { operationId: s.operationId } : {}),
              messageId: s.messageId,
              blockId: s.blockId,
            }),
            (this.sawComplete = !0),
            (this.currentOperationId = null),
            (this.currentMessageId = null),
            (this.currentBlockId = null),
            (this.currentQueue = []));
        } else this.pendingQueue.shift();
    }
    if ((this.frameCount++, this.frameCount % 3 === 0)) {
      let u = 0;
      for (let n = 0; n < o; n++) u += r[n] * r[n];
      const a = Math.sqrt(u / o);
      this.port.postMessage({ type: "amplitude", value: a });
    }
    return (
      this.sawComplete &&
        !this.sentTtsComplete &&
        this.currentOperationId === null &&
        this.currentMessageId === null &&
        this.currentBlockId === null &&
        this.pendingQueue.length === 0 &&
        (this.port.postMessage({ type: "tts_complete" }),
        (this.sentTtsComplete = !0),
        (this.sawComplete = !1)),
      !0
    );
  }
  currentBlockCushionReady() {
    let t = -this.readIndex;
    for (const e of this.currentQueue) {
      if (e.isComplete) return !0;
      t += e.samples.length;
    }
    return t >= 12800;
  }
  postBlockDiag(t) {
    this.port.postMessage({
      type: "diag",
      kind: t,
      ...(this.currentOperationId !== null ? { operationId: this.currentOperationId } : {}),
      ...(this.currentMessageId !== null ? { messageId: this.currentMessageId } : {}),
      ...(this.currentBlockId !== null ? { blockId: this.currentBlockId } : {}),
    });
  }
  clearCurrentBlock(t) {
    (this.postBlockDiag(t),
      (this.currentOperationId = null),
      (this.currentMessageId = null),
      (this.currentBlockId = null),
      (this.currentQueue = []),
      (this.readIndex = 0),
      (this.starvedQuanta = 0),
      (this.rebuffering = !1),
      (this.rebufferHeldQuanta = 0));
  }
  handleInterrupt(t) {
    ((this.pendingQueue = this.pendingQueue.filter((e) => e.messageId !== t)),
      this.currentMessageId === t && this.clearCurrentBlock("interrupt_drop"));
  }
  handleCut(t, e) {
    ((this.pendingQueue = this.pendingQueue.filter(
      (r) => !(r.operationId === t && (r.blockId ?? -1) > e),
    )),
      this.currentOperationId === t &&
        this.currentBlockId !== null &&
        this.currentBlockId > e &&
        this.clearCurrentBlock("cut_drop"));
  }
}
registerProcessor("pcm-player-processor", c);
