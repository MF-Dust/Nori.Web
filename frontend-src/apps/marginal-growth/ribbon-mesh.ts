import { Buffer, BufferUsage, Container, Geometry, Mesh, Shader, Texture } from "pixi.js";
import type { DestroyOptions } from "pixi.js";
import type { MarginalGrowthCache, MarginalGrowthStyleKeyframe } from "./decode";
import {
  MarginalGrowthSegments,
  MarginalGrowthTopology,
  type MarginalGrowthSegmentScratch,
} from "./topology";

/** Shipped `Ya`: antialias pad baked into each segment. */
const AA_PAD_BASE = 2;
/** Shipped `Qe`. */
export const RIBBON_LINE_WIDTH_CEILING = 2;
/** Shipped `Ve`. */
export const RIBBON_SWAY_AMPLITUDE_CEILING = 4;
/** Shipped `Xe`. */
export const RIBBON_WARP_AMPLITUDE_CEILING = 5;
/** Shipped `ke`: vertices per segment. */
const VERTICES_PER_SEGMENT = 4;
/** Shipped `kt`: indices per segment. */
const INDICES_PER_SEGMENT = 6;
/** Shipped `Ye`: static floats per vertex. */
const STATIC_FLOATS_PER_VERTEX = 15;
/** Shipped `he`: static vertex stride in bytes. */
const STATIC_STRIDE_BYTES = STATIC_FLOATS_PER_VERTEX * 4;
/** Shipped `Ke`: dynamic floats per vertex. */
const DYNAMIC_FLOATS_PER_VERTEX = 2;
/** Shipped `Ka`: dynamic vertex stride in bytes. */
const DYNAMIC_STRIDE_BYTES = DYNAMIC_FLOATS_PER_VERTEX * 4;

export interface RibbonBakeBounds {
  lineWidthCeiling: number;
  swayAmplitudeCeiling: number;
  warpAmplitudeCeiling: number;
}

export interface RibbonMeshDebugStats {
  totalSegments: number;
  mainSegments: number;
  sideSegments: number;
  visibleNodeCount: number;
}

/** Shipped `Ja`: last keyframe whose step is `<=` the current step. */
function thicknessAtStep(keyframes: readonly MarginalGrowthStyleKeyframe[], step: number): number {
  let lo = 0;
  let hi = keyframes.length - 1;
  let thickness = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const keyframe = keyframes[mid];
    if (keyframe.step <= step) {
      thickness = keyframe.thickness;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return thickness;
}

/**
 * Shipped `Za`. Segment quads for one decoded cache.
 * Topology comes from `MarginalGrowthTopology` / `MarginalGrowthSegments` (`Ha` / `Xa`).
 */
export class RibbonMesh extends Container {
  shader: Shader;
  cache: MarginalGrowthCache | null = null;
  topology: MarginalGrowthTopology | null = null;
  mesh: Mesh<Geometry, Shader> | null = null;
  geometry: Geometry | null = null;
  staticBuffer: Buffer | null = null;
  dynamicBuffer: Buffer | null = null;
  indexBuffer: Buffer | null = null;
  dynamicVertexData: Float32Array | null = null;
  segmentCount = 0;
  segmentNodeIdxA: Int32Array | null = null;
  segmentNodeIdxB: Int32Array | null = null;
  nodeThickness: Float32Array | null = null;
  lastStep = -1;
  bakeBounds: RibbonBakeBounds = {
    lineWidthCeiling: RIBBON_LINE_WIDTH_CEILING,
    swayAmplitudeCeiling: RIBBON_SWAY_AMPLITUDE_CEILING,
    warpAmplitudeCeiling: RIBBON_WARP_AMPLITUDE_CEILING,
  };

  constructor(shader: Shader) {
    super();
    this.shader = shader;
  }

  getTopology(): MarginalGrowthTopology | null {
    return this.topology;
  }

  setCache(cache: MarginalGrowthCache, bounds?: RibbonBakeBounds): void {
    if (bounds) this.bakeBounds = bounds;
    this.cache = cache;
    this.topology = new MarginalGrowthTopology(cache);
    this.bake();
    this.lastStep = -1;
  }

  isWithinBakeBounds(lineWidth: number, swayAmplitude: number, warpAmplitude: number): boolean {
    return (
      lineWidth <= this.bakeBounds.lineWidthCeiling &&
      swayAmplitude <= this.bakeBounds.swayAmplitudeCeiling &&
      warpAmplitude <= this.bakeBounds.warpAmplitudeCeiling
    );
  }

  updateStep(step: number, force = false): void {
    if (
      (!force && step === this.lastStep) ||
      !this.cache ||
      !this.topology ||
      !this.dynamicVertexData ||
      !this.dynamicBuffer ||
      !this.segmentNodeIdxA ||
      !this.segmentNodeIdxB ||
      !this.nodeThickness
    ) {
      return;
    }
    const topology = this.topology;
    const cache = this.cache;
    const dynamicVertexData = this.dynamicVertexData;
    const segmentNodeIdxA = this.segmentNodeIdxA;
    const segmentNodeIdxB = this.segmentNodeIdxB;
    const nodeThickness = this.nodeThickness;
    const keyframesByNode = cache.styleKeyframesByNode;
    const nodeCount = topology.nodeCount;
    for (let index = 0; index < nodeCount; index++) {
      const keyframes = keyframesByNode[topology.id[index]];
      nodeThickness[index] = keyframes ? thicknessAtStep(keyframes, step) : 0;
    }
    for (let segment = 0; segment < this.segmentCount; segment++) {
      const nodeA = segmentNodeIdxA[segment];
      const nodeB = segmentNodeIdxB[segment];
      const thicknessA = nodeA >= 0 ? nodeThickness[nodeA] : 0;
      const thicknessB = nodeB >= 0 ? nodeThickness[nodeB] : 0;
      const offset = segment * VERTICES_PER_SEGMENT * DYNAMIC_FLOATS_PER_VERTEX;
      dynamicVertexData[offset] = thicknessA;
      dynamicVertexData[offset + 1] = thicknessB;
      dynamicVertexData[offset + 2] = thicknessA;
      dynamicVertexData[offset + 3] = thicknessB;
      dynamicVertexData[offset + 4] = thicknessA;
      dynamicVertexData[offset + 5] = thicknessB;
      dynamicVertexData[offset + 6] = thicknessA;
      dynamicVertexData[offset + 7] = thicknessB;
    }
    this.dynamicBuffer.update(dynamicVertexData.byteLength);
    this.lastStep = step;
  }

  debugStats(step: number): RibbonMeshDebugStats {
    if (!this.topology) {
      return { totalSegments: 0, mainSegments: 0, sideSegments: 0, visibleNodeCount: 0 };
    }
    const topology = this.topology;
    let totalSegments = 0;
    let mainSegments = 0;
    let sideSegments = 0;
    let visibleNodeCount = 0;
    for (let index = 0; index < topology.nodeCount; index++) {
      if (topology.birthStep[index] > step) continue;
      visibleNodeCount += 1;
      const parentIdx = topology.parentIdx[index];
      if (parentIdx < 0) continue;
      totalSegments += 1;
      if (topology.mainChildIdx[parentIdx] === index) mainSegments += 1;
      else sideSegments += 1;
    }
    return { totalSegments, mainSegments, sideSegments, visibleNodeCount };
  }

  destroy(options?: DestroyOptions): void {
    if (this.mesh) {
      this.mesh.destroy();
      this.mesh = null;
    }
    this.geometry?.destroy(true);
    this.geometry = null;
    this.staticBuffer = null;
    this.dynamicBuffer = null;
    this.indexBuffer = null;
    super.destroy(options);
  }

  private bake(): void {
    if (!this.cache || !this.topology) return;
    if (this.mesh) {
      this.mesh.destroy();
      this.mesh = null;
    }
    this.geometry?.destroy(true);
    const segments = new MarginalGrowthSegments(
      this.topology,
      this.cache,
      this.bakeBounds.lineWidthCeiling,
      this.bakeBounds.swayAmplitudeCeiling,
      this.bakeBounds.warpAmplitudeCeiling,
      AA_PAD_BASE,
    );
    const segmentCount = segments.totalSegmentCount();
    this.segmentCount = segmentCount;
    const indexCount = segmentCount * INDICES_PER_SEGMENT;
    const staticData = new Float32Array(segmentCount * VERTICES_PER_SEGMENT * STATIC_FLOATS_PER_VERTEX);
    this.dynamicVertexData = new Float32Array(
      segmentCount * VERTICES_PER_SEGMENT * DYNAMIC_FLOATS_PER_VERTEX,
    );
    const indices = new Uint32Array(indexCount);
    this.segmentNodeIdxA = new Int32Array(segmentCount);
    this.segmentNodeIdxB = new Int32Array(segmentCount);
    this.nodeThickness = new Float32Array(this.topology.nodeCount);
    let segmentIndex = 0;
    segments.forEach((segment) => {
      this.writeStaticSegment(staticData, indices, segmentIndex, segment);
      this.segmentNodeIdxA![segmentIndex] = segment.nodeIdxA;
      this.segmentNodeIdxB![segmentIndex] = segment.nodeIdxB;
      segmentIndex += 1;
    });
    this.staticBuffer = new Buffer({
      data: staticData,
      usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
      label: "ribbon-static",
    });
    this.dynamicBuffer = new Buffer({
      data: this.dynamicVertexData,
      usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
      label: "ribbon-dynamic",
    });
    this.indexBuffer = new Buffer({
      data: indices,
      usage: BufferUsage.INDEX | BufferUsage.COPY_DST,
      label: "ribbon-indices",
    });
    this.geometry = new Geometry({
      attributes: {
        aPosition: {
          buffer: this.staticBuffer,
          format: "float32x2",
          stride: STATIC_STRIDE_BYTES,
          offset: 0,
        },
        aSegAB: {
          buffer: this.staticBuffer,
          format: "float32x4",
          stride: STATIC_STRIDE_BYTES,
          offset: 8,
        },
        aChainDist: {
          buffer: this.staticBuffer,
          format: "float32x2",
          stride: STATIC_STRIDE_BYTES,
          offset: 24,
        },
        aMeta: {
          buffer: this.staticBuffer,
          format: "float32x3",
          stride: STATIC_STRIDE_BYTES,
          offset: 32,
        },
        aBranchAB: {
          buffer: this.staticBuffer,
          format: "float32x2",
          stride: STATIC_STRIDE_BYTES,
          offset: 44,
        },
        aBranchLen: {
          buffer: this.staticBuffer,
          format: "float32x2",
          stride: STATIC_STRIDE_BYTES,
          offset: 52,
        },
        aThicknessAB: {
          buffer: this.dynamicBuffer,
          format: "float32x2",
          stride: DYNAMIC_STRIDE_BYTES,
          offset: 0,
        },
      },
      indexBuffer: this.indexBuffer,
      topology: "triangle-list",
    });
    this.mesh = new Mesh<Geometry, Shader>({
      geometry: this.geometry,
      shader: this.shader,
      texture: Texture.WHITE,
    });
    this.mesh.blendMode = "max";
    this.addChild(this.mesh);
  }

  private writeStaticSegment(
    staticData: Float32Array,
    indices: Uint32Array,
    segmentIndex: number,
    segment: MarginalGrowthSegmentScratch,
  ): void {
    let dirX = segment.bx - segment.ax;
    let dirY = segment.by - segment.ay;
    const length = Math.hypot(dirX, dirY);
    if (length < 1e-9) {
      dirX = 1;
      dirY = 0;
    } else {
      dirX /= length;
      dirY /= length;
    }
    const half = Math.max(segment.maxWidthA, segment.maxWidthB);
    const normalX = -dirY * half;
    const normalY = dirX * half;
    const tangentX = dirX * half;
    const tangentY = dirY * half;
    const x0 = segment.ax + normalX - tangentX;
    const y0 = segment.ay + normalY - tangentY;
    const x1 = segment.ax - normalX - tangentX;
    const y1 = segment.ay - normalY - tangentY;
    const x2 = segment.bx - normalX + tangentX;
    const y2 = segment.by - normalY + tangentY;
    const x3 = segment.bx + normalX + tangentX;
    const y3 = segment.by + normalY + tangentY;
    const vertexBase = segmentIndex * VERTICES_PER_SEGMENT;
    const writeVertex = (vertex: number, x: number, y: number) => {
      const offset = (vertexBase + vertex) * STATIC_FLOATS_PER_VERTEX;
      staticData[offset] = x;
      staticData[offset + 1] = y;
      staticData[offset + 2] = segment.ax;
      staticData[offset + 3] = segment.ay;
      staticData[offset + 4] = segment.bx;
      staticData[offset + 5] = segment.by;
      staticData[offset + 6] = segment.chainDistA;
      staticData[offset + 7] = segment.chainDistB;
      staticData[offset + 8] = segment.birthStep;
      staticData[offset + 9] = segment.layerFlag;
      staticData[offset + 10] = segment.isMainChainAtParent;
      staticData[offset + 11] = segment.branchIdA;
      staticData[offset + 12] = segment.branchIdB;
      staticData[offset + 13] = segment.branchLenA;
      staticData[offset + 14] = segment.branchLenB;
    };
    writeVertex(0, x0, y0);
    writeVertex(1, x1, y1);
    writeVertex(2, x2, y2);
    writeVertex(3, x3, y3);
    const indexBase = segmentIndex * INDICES_PER_SEGMENT;
    indices[indexBase] = vertexBase;
    indices[indexBase + 1] = vertexBase + 1;
    indices[indexBase + 2] = vertexBase + 2;
    indices[indexBase + 3] = vertexBase;
    indices[indexBase + 4] = vertexBase + 2;
    indices[indexBase + 5] = vertexBase + 3;
  }
}
