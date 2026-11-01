import { decodeMarginalGrowthCache, type MarginalGrowthCache } from "./decode";

/** Shipped `Da`. The browser serves these from `public/`. */
export function marginalGrowthCacheUrl(shape: string): string {
  return `/marginal-growth-cache-${shape}.bin`;
}

/** Shipped `Ga`: fetch the gzip cache, decompress, then decode. */
export async function loadMarginalGrowthCache(shape: string): Promise<MarginalGrowthCache> {
  const response = await fetch(marginalGrowthCacheUrl(shape));
  if (!response.ok || response.body == null) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const decompressed = response.body.pipeThrough(new DecompressionStream("gzip"));
  const buffer = await new Response(decompressed).arrayBuffer();
  return decodeMarginalGrowthCache(buffer);
}
