import { useEffect, useMemo, useState } from "react";

export const DATASEA_GAME_IDS = ["steady", "resonance", "current", "relay", "echo", "denoise", "discern", "ripple", "sweep", "unknot", "lure", "balance"] as const;
type GameId = typeof DATASEA_GAME_IDS[number];
const TITLES: Record<GameId, string> = { steady: "稳态", resonance: "共振", current: "逆流", relay: "中继", echo: "应答", denoise: "降噪", discern: "辨认", ripple: "波纹", sweep: "扫描", unknot: "解结", lure: "引航", balance: "平衡" };

function tapsNeeded(id: GameId) { return ({ steady: 6, echo: 5, denoise: 8, sweep: 5, current: 4, relay: 4, discern: 3, unknot: 4, lure: 5 } as Partial<Record<GameId, number>>)[id] ?? 0; }
export function DataseaMicrogame({ id, solved, onSolved }: { id: GameId; solved: boolean; onSolved: () => void }) {
  const [progress, setProgress] = useState(0), [axes, setAxes] = useState([0, 0, 0]);
  const target = useMemo(() => id === "resonance" ? [62, 34, 78] : id === "ripple" ? [45, 70, 28] : [50, 50, 50], [id]);
  useEffect(() => { if (!solved && (id === "resonance" || id === "ripple" || id === "balance") && axes.every((value, index) => Math.abs(value - target[index]) <= 5)) onSolved(); }, [axes, id, onSolved, solved, target]);
  const tap = () => { if (solved) return; const next = progress + 1; setProgress(next); if (next >= tapsNeeded(id)) onSolved(); };
  return <div className={`datasea-game datasea-game-${id}`} data-game={id} data-solved={solved}>
    <header><b>{TITLES[id]}</b><span>{id}</span></header>
    {id === "resonance" || id === "ripple" || id === "balance" ? <div className="datasea-tuners">{axes.map((value, index) => <label key={index}><span>{["X", "Y", "Z"][index]}</span><input aria-label={`${id} axis ${index + 1}`} type="range" min="0" max="100" value={value} onChange={(event) => setAxes((old) => old.map((entry, axis) => axis === index ? Number(event.target.value) : entry))} /></label>)}</div> : <button type="button" className="datasea-game-field" onPointerDown={tap} aria-label={`${id} interaction field`}><i style={{ width: `${Math.min(100, progress / Math.max(1, tapsNeeded(id)) * 100)}%` }} /><span>{solved ? "SYNC" : id === "echo" ? ["○", "◇", "△", "□", "○"][progress] : id === "discern" ? `FRAGMENT ${progress + 1}` : id === "unknot" ? `CROSSINGS ${Math.max(0, 4 - progress)}` : id === "lure" ? "FOLLOW LIGHT" : id === "sweep" ? "PASS BAND" : id === "denoise" ? "CLEAR NOISE" : id === "current" ? "PUSH SIGNAL" : id === "relay" ? "ROTATE LINK" : "PULSE"}</span></button>}
  </div>;
}
