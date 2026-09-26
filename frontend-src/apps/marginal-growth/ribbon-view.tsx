import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { MarginalGrowthParams, ResolvedCameraClamp } from "../../state/marginal-growth-store";
import { accentsForColor } from "./shaders";
import {
  MARGINAL_GROWTH_WORLD_SIZE,
  createMarginalGrowthApp,
  type MarginalGrowthApp,
  type MarginalGrowthShape,
} from "./ribbon-world";

export interface MarginalGrowthRibbonViewProps {
  shape: MarginalGrowthShape;
  params: MarginalGrowthParams;
  owned?: Record<string, number> | null;
  accentColor: number;
  cameraClamp?: ResolvedCameraClamp;
  backgroundColor?: number;
  /** Shipped world `onTap`: a press that did not drag. */
  onTap?: () => void;
  reserveShopSpace?: boolean;
}

/**
 * Mounts the shipped ribbon world into an `absolute inset-0` host.
 * Effect inputs follow IdleScreen `Qs`: the Pixi app is created once, then
 * `setParams` / `setShape` / `setOwned` / `setAccents` / `setCameraClamp`
 * re-fire when those values change and again once the async app is ready.
 * `tick` stays on the Pixi ticker and reads the params object `setParams` stored.
 */
export function MarginalGrowthRibbonView({
  shape,
  params,
  owned = null,
  accentColor,
  cameraClamp,
  backgroundColor = 0,
  onTap,
  reserveShopSpace = false,
}: MarginalGrowthRibbonViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<MarginalGrowthApp | null>(null);
  const [ready, setReady] = useState(false);
  const shapeRef = useRef(shape);
  const paramsRef = useRef(params);
  const ownedRef = useRef(owned);
  const accentRef = useRef(accentColor);
  const clampRef = useRef(cameraClamp);
  const tapRef = useRef(onTap);
  const backgroundRef = useRef(backgroundColor);
  shapeRef.current = shape;
  paramsRef.current = params;
  ownedRef.current = owned;
  accentRef.current = accentColor;
  clampRef.current = cameraClamp;
  tapRef.current = onTap;
  backgroundRef.current = backgroundColor;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let createdApp: MarginalGrowthApp | null = null;
    void createMarginalGrowthApp(host, {
      params: paramsRef.current,
      shape: shapeRef.current,
      worldSize: MARGINAL_GROWTH_WORLD_SIZE,
      cameraClamp: clampRef.current,
      backgroundColor: backgroundRef.current,
      onTap: () => tapRef.current?.(),
    }).then((created) => {
      if (cancelled) {
        created.destroy();
        return;
      }
      createdApp = created;
      appRef.current = created;
      created.ribbon.setOwned(ownedRef.current);
      created.ribbon.setAccents(accentsForColor(accentRef.current));
      if (clampRef.current) created.setCameraClamp(clampRef.current);
      setReady(true);
    });
    return () => {
      cancelled = true;
      createdApp?.destroy();
      appRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    appRef.current?.ribbon.setParams(params);
  }, [params, ready]);

  useEffect(() => {
    appRef.current?.ribbon.setShape(shape);
  }, [shape, ready]);

  useEffect(() => {
    appRef.current?.ribbon.setOwned(owned);
  }, [owned, ready]);

  useEffect(() => {
    appRef.current?.ribbon.setAccents(accentsForColor(accentColor));
  }, [accentColor, ready]);

  useEffect(() => {
    if (cameraClamp) appRef.current?.setCameraClamp(cameraClamp);
  }, [cameraClamp, ready]);

  useEffect(() => {
    appRef.current?.setBackgroundColor(backgroundColor);
  }, [backgroundColor, ready]);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0"
      style={{ position: "absolute", inset: 0 }}
    >
      <button
        type="button"
        className="absolute bottom-3 z-10 flex size-8 items-center justify-center border bg-black/45 text-white"
        style={{ right: reserveShopSpace ? 240 : 12 }}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => appRef.current?.recenter()}
        aria-label="Recenter compute field"
      >
        <RotateCcw className="size-4" />
      </button>
    </div>
  );
}
