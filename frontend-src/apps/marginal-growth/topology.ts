import type { MarginalGrowthCache } from "./decode";

/** Shipped score fallback when either segment is shorter than this (`1e-9`). */
const SCORE_LENGTH_EPSILON = 1e-9;

/**
 * Shipped segment-width constants just above `Xa`:
 * `$a`, `za`, `qa`, `Pt`, `Qa`, `Va`.
 */
const SWAY_AMPLITUDE_SCALE = 1.84;
const SAME_BRANCH_WIDTH_FACTOR = 0.15;
const BRANCH_CHANGE_WIDTH_FACTOR = 2;
const LINE_WIDTH_SCALE = 1.2;
const WARP_AMPLITUDE_SCALE = 0.5;
const CHORD_STRETCH_CAP = 4;

/** Port of shipped `Ha`: typed-array topology built from a decoded cache. */
export class MarginalGrowthTopology {
  readonly nodeCount: number;
  readonly idToIndex: Map<number, number>;
  readonly id: Uint32Array;
  readonly parentIdx: Int32Array;
  readonly mainChildIdx: Int32Array;
  readonly chainDist: Float32Array;
  readonly branchId: Uint32Array;
  readonly branchLen: Float32Array;
  readonly birthStep: Float32Array;
  readonly layerFlag: Uint8Array;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly parentX: Float32Array;
  readonly parentY: Float32Array;
  readonly radius: Float32Array;
  readonly childCount: Uint16Array;
  readonly maxThickness: Float32Array;
  readonly mainChildIdxByRootParentId: Map<number, number>;

  constructor(cache: MarginalGrowthCache) {
    const nodeCount = cache.nodes.length;
    this.nodeCount = nodeCount;
    this.id = new Uint32Array(nodeCount);
    this.parentIdx = new Int32Array(nodeCount);
    this.mainChildIdx = new Int32Array(nodeCount).fill(-1);
    this.chainDist = new Float32Array(nodeCount);
    this.branchId = new Uint32Array(nodeCount);
    this.branchLen = new Float32Array(nodeCount);
    this.birthStep = new Float32Array(nodeCount);
    this.layerFlag = new Uint8Array(nodeCount);
    this.x = new Float32Array(nodeCount);
    this.y = new Float32Array(nodeCount);
    this.parentX = new Float32Array(nodeCount);
    this.parentY = new Float32Array(nodeCount);
    this.radius = new Float32Array(nodeCount);
    this.childCount = new Uint16Array(nodeCount);
    this.maxThickness = new Float32Array(nodeCount);

    const idToIndex = new Map<number, number>();
    for (let index = 0; index < nodeCount; index++) {
      const node = cache.nodes[index];
      idToIndex.set(node.id, index);
      this.id[index] = node.id;
      this.birthStep[index] = node.birthStep;
      this.layerFlag[index] = node.layer === "circle" ? 0 : 1;
      this.x[index] = node.x;
      this.y[index] = node.y;
      this.parentX[index] = node.parentX;
      this.parentY[index] = node.parentY;
      this.radius[index] = node.radius;
      this.childCount[index] = node.childCount;
    }
    this.idToIndex = idToIndex;

    for (let index = 0; index < nodeCount; index++) {
      const parentId = cache.nodes[index].parentId;
      this.parentIdx[index] = parentId != null ? (idToIndex.get(parentId) ?? -1) : -1;
    }

    const bestScore = new Float32Array(nodeCount);
    const hasMainChild = new Uint8Array(nodeCount);
    const rootCandidates = new Map<number, { childIdx: number; score: number }>();
    for (let index = 0; index < nodeCount; index++) {
      const parentId = cache.nodes[index].parentId;
      if (parentId == null) continue;
      const parentIdx = this.parentIdx[index];
      if (parentIdx >= 0) {
        const score = this.scoreInCache(index, parentIdx);
        if (!hasMainChild[parentIdx] || score > bestScore[parentIdx]) {
          hasMainChild[parentIdx] = 1;
          bestScore[parentIdx] = score;
          this.mainChildIdx[parentIdx] = index;
        }
      } else {
        const score = -this.id[index];
        const current = rootCandidates.get(parentId);
        if (!current || score > current.score) {
          rootCandidates.set(parentId, { childIdx: index, score });
        }
      }
    }

    const mainChildIdxByRootParentId = new Map<number, number>();
    for (const [parentId, { childIdx }] of rootCandidates) {
      mainChildIdxByRootParentId.set(parentId, childIdx);
    }
    this.mainChildIdxByRootParentId = mainChildIdxByRootParentId;

    for (let index = 0; index < nodeCount; index++) {
      const parentIdx = this.parentIdx[index];
      const length = Math.hypot(
        this.x[index] - this.parentX[index],
        this.y[index] - this.parentY[index],
      );
      const parentChain = parentIdx >= 0 ? this.chainDist[parentIdx] : 0;
      this.chainDist[index] = parentChain + length;
    }

    let nextBranchId = 0;
    for (let index = 0; index < nodeCount; index++) {
      const parentIdx = this.parentIdx[index];
      if (parentIdx >= 0 && this.mainChildIdx[parentIdx] === index) {
        this.branchId[index] = this.branchId[parentIdx];
      } else {
        this.branchId[index] = nextBranchId;
        nextBranchId += 1;
      }
    }

    const branchMin = new Float32Array(nextBranchId);
    const branchMax = new Float32Array(nextBranchId);
    const branchSeen = new Uint8Array(nextBranchId);
    for (let index = 0; index < nodeCount; index++) {
      const branch = this.branchId[index];
      const distance = this.chainDist[index];
      if (branchSeen[branch]) {
        if (distance < branchMin[branch]) branchMin[branch] = distance;
        if (distance > branchMax[branch]) branchMax[branch] = distance;
      } else {
        branchSeen[branch] = 1;
        branchMin[branch] = distance;
        branchMax[branch] = distance;
      }
    }
    for (let index = 0; index < nodeCount; index++) {
      const branch = this.branchId[index];
      this.branchLen[index] = branchMax[branch] - branchMin[branch];
    }

    const keyframesByNode = cache.styleKeyframesByNode;
    for (let index = 0; index < nodeCount; index++) {
      const keyframes = keyframesByNode[this.id[index]];
      if (!keyframes) continue;
      let maxThickness = 0;
      for (const keyframe of keyframes) {
        if (keyframe.thickness > maxThickness) maxThickness = keyframe.thickness;
      }
      this.maxThickness[index] = maxThickness;
    }
  }

  isMainChildOfParent(nodeIdx: number, parentId: number | null | undefined): boolean {
    if (parentId == null) return false;
    const parentIdx = this.idToIndex.get(parentId);
    return parentIdx !== undefined
      ? this.mainChildIdx[parentIdx] === nodeIdx
      : this.mainChildIdxByRootParentId.get(parentId) === nodeIdx;
  }

  scoreInCache(nodeIdx: number, parentIdx: number): number {
    const parentDx = this.x[parentIdx] - this.parentX[parentIdx];
    const parentDy = this.y[parentIdx] - this.parentY[parentIdx];
    const parentLength = Math.hypot(parentDx, parentDy);
    const childDx = this.x[nodeIdx] - this.x[parentIdx];
    const childDy = this.y[nodeIdx] - this.y[parentIdx];
    const childLength = Math.hypot(childDx, childDy);
    return parentLength < SCORE_LENGTH_EPSILON || childLength < SCORE_LENGTH_EPSILON
      ? -this.id[nodeIdx]
      : (parentDx * childDx + parentDy * childDy) / (parentLength * childLength);
  }
}

export interface MarginalGrowthSegmentScratch {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  chainDistA: number;
  chainDistB: number;
  branchIdA: number;
  branchIdB: number;
  branchLenA: number;
  branchLenB: number;
  nodeIdxA: number;
  nodeIdxB: number;
  birthStep: number;
  layerFlag: number;
  isMainChainAtParent: number;
  maxWidthA: number;
  maxWidthB: number;
}

/** Port of shipped `Xa`: one segment per node, no renderer dependency. */
export class MarginalGrowthSegments {
  readonly topology: MarginalGrowthTopology;
  readonly cache: MarginalGrowthCache;
  readonly lineWidthCeiling: number;
  readonly swayAmplitudeCeiling: number;
  readonly warpAmplitudeCeiling: number;
  readonly aaPadBase: number;
  readonly scratch: MarginalGrowthSegmentScratch = {
    ax: 0,
    ay: 0,
    bx: 0,
    by: 0,
    chainDistA: 0,
    chainDistB: 0,
    branchIdA: 0,
    branchIdB: 0,
    branchLenA: 0,
    branchLenB: 0,
    nodeIdxA: -1,
    nodeIdxB: -1,
    birthStep: 0,
    layerFlag: 0,
    isMainChainAtParent: 0,
    maxWidthA: 0,
    maxWidthB: 0,
  };

  constructor(
    topology: MarginalGrowthTopology,
    cache: MarginalGrowthCache,
    lineWidthCeiling: number,
    swayAmplitudeCeiling: number,
    warpAmplitudeCeiling: number,
    aaPadBase: number,
  ) {
    this.topology = topology;
    this.cache = cache;
    this.lineWidthCeiling = lineWidthCeiling;
    this.swayAmplitudeCeiling = swayAmplitudeCeiling;
    this.warpAmplitudeCeiling = warpAmplitudeCeiling;
    this.aaPadBase = aaPadBase;
  }

  totalSegmentCount(): number {
    return this.topology.nodeCount;
  }

  forEach(visit: (scratch: MarginalGrowthSegmentScratch) => void): void {
    const topology = this.topology;
    const scratch = this.scratch;
    const sway = SWAY_AMPLITUDE_SCALE * this.swayAmplitudeCeiling;
    const warp = WARP_AMPLITUDE_SCALE * this.warpAmplitudeCeiling;
    for (let index = 0; index < topology.nodeCount; index++) {
      const parentIdx = topology.parentIdx[index];
      const hasParent = parentIdx >= 0;
      scratch.ax = topology.parentX[index];
      scratch.ay = topology.parentY[index];
      scratch.bx = topology.x[index];
      scratch.by = topology.y[index];
      scratch.chainDistA = hasParent ? topology.chainDist[parentIdx] : 0;
      scratch.chainDistB = topology.chainDist[index];
      scratch.branchIdA = hasParent ? topology.branchId[parentIdx] : topology.branchId[index];
      scratch.branchIdB = topology.branchId[index];
      scratch.branchLenA = hasParent ? topology.branchLen[parentIdx] : topology.branchLen[index];
      scratch.branchLenB = topology.branchLen[index];
      scratch.nodeIdxA = parentIdx;
      scratch.nodeIdxB = index;
      scratch.birthStep = topology.birthStep[index];
      scratch.layerFlag = topology.layerFlag[index];
      if (hasParent) {
        scratch.isMainChainAtParent = topology.mainChildIdx[parentIdx] === index ? 1 : 0;
      } else {
        const parentId = this.cache.nodes[index].parentId;
        scratch.isMainChainAtParent =
          parentId != null && topology.mainChildIdxByRootParentId.get(parentId) === index ? 1 : 0;
      }
      const thicknessA = hasParent
        ? topology.maxThickness[parentIdx]
        : topology.maxThickness[index];
      const thicknessB = topology.maxThickness[index];
      const widthFactor =
        scratch.branchIdA === scratch.branchIdB
          ? SAME_BRANCH_WIDTH_FACTOR
          : BRANCH_CHANGE_WIDTH_FACTOR;
      const chord = Math.max(1, Math.hypot(scratch.bx - scratch.ax, scratch.by - scratch.ay));
      const swayDistance = widthFactor * sway;
      const stretch = Math.min(CHORD_STRETCH_CAP, Math.sqrt(1 + (swayDistance / chord) ** 2));
      const halfWidthA = ((this.lineWidthCeiling + thicknessA) / 2) * LINE_WIDTH_SCALE;
      const halfWidthB = ((this.lineWidthCeiling + thicknessB) / 2) * LINE_WIDTH_SCALE;
      scratch.maxWidthA = (halfWidthA + this.aaPadBase) * stretch + warp;
      scratch.maxWidthB = (halfWidthB + this.aaPadBase) * stretch + warp;
      visit(scratch);
    }
  }
}
