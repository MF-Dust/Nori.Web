/**
 * Marginal-growth cache binary.
 * Port of shipped `La` (`public/assets/IdleScreen-DCDB640k.js`).
 */

/** Shipped `Ua`. Little-endian bytes are the ASCII tag `MGB1`. */
const CACHE_MAGIC = 826427213;
/** Shipped `_a`. Stored thickness units are multiplied by this. */
const THICKNESS_SCALE = 0.03;
/** Shipped `At`. Stored positions are divided by this. */
const POSITION_SCALE = 10;

export type MarginalGrowthLayer = "circle" | "icon";

export interface MarginalGrowthNode {
  id: number;
  parentId: number;
  layer: MarginalGrowthLayer;
  birthStep: number;
  x: number;
  y: number;
  parentX: number;
  parentY: number;
  radius: number;
  childCount: number;
}

export interface MarginalGrowthStyleKeyframe {
  step: number;
  thickness: number;
}

/** Node id keys. Nodes with no style runs are absent, matching shipped `L`. */
export type MarginalGrowthStyleKeyframesByNode = {
  [nodeId: number]: MarginalGrowthStyleKeyframe[] | undefined;
};

export interface MarginalGrowthCache {
  signature: string;
  maxSteps: number;
  chunkSize: number;
  nodes: MarginalGrowthNode[];
  styleKeyframesByNode: MarginalGrowthStyleKeyframesByNode;
  dirtyChunksByStep: number[][];
  /** Shipped `La` always returns this empty. */
  pathFrames: unknown[];
}

/** Shipped `le`: round a byte offset up to a multiple of 4. */
function alignUp4(offset: number): number {
  return (offset + 3) & -4;
}

export function decodeMarginalGrowthCache(buffer: ArrayBuffer): MarginalGrowthCache {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== CACHE_MAGIC) {
    throw new Error("not a marginal-growth cache binary (bad magic)");
  }

  const maxSteps = view.getUint32(4, true);
  const chunkSize = view.getUint32(8, true);
  const nodeCount = view.getUint32(12, true);
  const styleRunCount = view.getUint32(16, true);
  const dirtyEntryCount = view.getUint32(20, true);
  const signatureBytes = view.getUint32(24, true);
  const signature = new TextDecoder().decode(new Uint8Array(buffer, 28, signatureBytes));

  let cursor = 28 + alignUp4(signatureBytes);
  const [signatureWidth, signatureHeight] = signature.split(":").map(Number);
  const originX = signatureWidth / 2;
  const originY = signatureHeight / 2;

  const nodes = new Array<MarginalGrowthNode>(nodeCount);
  const idOffset = cursor;
  const parentDeltaOffset = idOffset + nodeCount * 4;
  const layerOffset = parentDeltaOffset + nodeCount * 4;
  const birthOffset = alignUp4(layerOffset + nodeCount);
  const xOffset = alignUp4(birthOffset + nodeCount * 2);
  const yOffset = xOffset + nodeCount * 4;

  let id = 0;
  let birthStep = 0;
  for (let index = 0; index < nodeCount; index++) {
    id += view.getUint32(idOffset + index * 4, true);
    birthStep += view.getUint16(birthOffset + index * 2, true);
    const x = view.getInt32(xOffset + index * 4, true) / POSITION_SCALE;
    const y = view.getInt32(yOffset + index * 4, true) / POSITION_SCALE;
    nodes[index] = {
      id,
      parentId: id - view.getUint32(parentDeltaOffset + index * 4, true),
      layer: view.getUint8(layerOffset + index) === 0 ? "circle" : "icon",
      birthStep,
      x,
      y,
      parentX: originX,
      parentY: originY,
      radius: Math.hypot(x - originX, y - originY),
      childCount: 0,
    };
  }

  cursor = yOffset + nodeCount * 4;
  const nodesById = new Map<number, MarginalGrowthNode>();
  for (const node of nodes) nodesById.set(node.id, node);
  for (const node of nodes) {
    const parent = nodesById.get(node.parentId);
    if (parent) {
      node.parentX = parent.x;
      node.parentY = parent.y;
      parent.childCount += 1;
    }
  }

  const styleCountOffset = cursor;
  const styleRunOffset = alignUp4(styleCountOffset + nodeCount * 2);
  const styleKeyframesByNode: MarginalGrowthStyleKeyframesByNode = {};
  let runCursor = styleRunOffset;
  for (let index = 0; index < nodeCount; index++) {
    const runCount = view.getUint16(styleCountOffset + index * 2, true);
    if (runCount === 0) continue;
    const keyframes: MarginalGrowthStyleKeyframe[] = [];
    let step = 0;
    let thicknessUnits = 0;
    for (let run = 0; run < runCount; run++) {
      step += view.getInt16(runCursor, true);
      thicknessUnits += view.getInt16(runCursor + 2, true);
      const span = view.getInt16(runCursor + 4, true);
      runCursor += 6;
      for (let frame = 0; frame < span; frame++) {
        keyframes.push({
          step: step + frame,
          thickness: (thicknessUnits + frame) * THICKNESS_SCALE,
        });
      }
      step += span - 1;
      thicknessUnits += span - 1;
    }
    styleKeyframesByNode[nodes[index].id] = keyframes;
  }

  cursor = alignUp4(styleRunOffset + styleRunCount * 6);
  const dirtyCountOffset = cursor;
  const dirtyIndexOffset = alignUp4(dirtyCountOffset + (maxSteps + 1) * 2);
  const dirtyChunksByStep = new Array<number[]>(maxSteps + 1);
  let dirtyCursor = dirtyIndexOffset;
  for (let step = 0; step <= maxSteps; step++) {
    const count = view.getUint16(dirtyCountOffset + step * 2, true);
    const chunks = new Array<number>(count);
    for (let index = 0; index < count; index++) {
      chunks[index] = view.getUint16(dirtyCursor, true);
      dirtyCursor += 2;
    }
    dirtyChunksByStep[step] = chunks;
  }

  cursor = alignUp4(dirtyIndexOffset + dirtyEntryCount * 2);
  if (cursor !== buffer.byteLength) {
    throw new Error(`decode size mismatch: read ${cursor}, buffer is ${buffer.byteLength}`);
  }

  return {
    signature,
    maxSteps,
    chunkSize,
    nodes,
    styleKeyframesByNode,
    dirtyChunksByStep,
    pathFrames: [],
  };
}
