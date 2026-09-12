import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Chess, type Square } from "chess.js";
import { legalChessMoves, type ChessSide } from "../apps/chess-model";
import { ChessPiece } from "./chess-piece";

export interface ChessBoardProps {
  fen: string;
  side: ChessSide;
  size: number;
  interactive: boolean;
  lastMove?: { from: string; to: string } | null;
  tutorialMove?: { from: string; to: string } | null;
  onMove(from: string, to: string, promotion?: "q" | "r" | "b" | "n"): void;
  onReturnToLive?(): void;
}
export function ChessBoard({ fen, side, size, interactive, lastMove, tutorialMove, onMove, onReturnToLive }: ChessBoardProps) {
  const board = useMemo(() => new Chess(fen), [fen]);
  const [selected, select] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<{ from: string; to: string } | null>(null);
  const drag = useRef<{ from: string; x: number; y: number; pointer: number } | null>(null);
  const suppressClick = useRef(false);
  const [dragged, setDragged] = useState<{ from: string; x: number; y: number } | null>(null);
  useEffect(() => { select(null); setPromotion(null); setDragged(null); drag.current = null; }, [fen, interactive]);
  const legal = selected && (!tutorialMove || selected === tutorialMove.from) ? legalChessMoves(fen, selected) : [];
  const files = side === "white" ? "abcdefgh" : "hgfedcba";
  const ranks = side === "white" ? "87654321" : "12345678";
  function move(from: string, to: string) {
    if (!interactive || promotion) return;
    if (tutorialMove && (from !== tutorialMove.from || to !== tutorialMove.to)) return;
    const moves = legalChessMoves(fen, from).filter(item => item.to === to);
    if (!moves.length) return;
    select(null);
    if (moves.some(item => item.promotion)) setPromotion({ from, to });
    else onMove(from, to);
  }
  function activate(square: string) {
    if (!interactive) { onReturnToLive?.(); return; }
    if (promotion) return;
    if (selected && legal.some(item => item.to === square)) { move(selected, square); return; }
    select(selected === square ? null : legalChessMoves(fen, square).length ? square : null);
  }
  function down(event: PointerEvent<HTMLButtonElement>, square: string) {
    if (!interactive || event.button !== 0 || promotion || !legalChessMoves(fen, square).length) return;
    drag.current = { from: square, x: event.clientX, y: event.clientY, pointer: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function up(event: PointerEvent<HTMLButtonElement>) {
    const start = drag.current;
    drag.current = null;
    setDragged(null);
    if (!start || start.pointer !== event.pointerId) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) {
      suppressClick.current = true;
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-chess-square]");
      const root = event.currentTarget.closest("[data-chess-board]");
      if (target && root?.contains(target)) move(start.from, target.dataset.chessSquare!);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return <div data-chess-board className="source-chess-board-frame" style={{ width: size + 16 }}>
    <div className="source-chess-ranks">{[...ranks].map(rank => <span key={rank}>{rank}</span>)}</div>
    <div className="source-chess-board" role="group" aria-label="Chess board" style={{ width: size, height: size }}>
      {[...ranks].flatMap((rank, row) => [...files].map((file, column) => {
        const square = file + rank;
        const piece = board.get(square as Square);
        const target = legal.find(item => item.to === square);
        const light = (row + column) % 2 === 0;
        const recent = lastMove && (square === lastMove.from || square === lastMove.to);
        const tutorial = tutorialMove && (square === tutorialMove.from || square === tutorialMove.to);
        return <button type="button" key={square} data-chess-square={square}
          aria-label={square + (piece ? " " + (piece.color === "w" ? "white" : "black") + " " + piece.type : "")}
          aria-pressed={selected === square}
          className={"source-chess-square " + (light ? "light" : "dark")}
          style={{ background: tutorial ? "rgba(100,220,170,.35)" : selected === square ? "rgba(160,230,255,.4)" : recent ? "rgba(255,200,100,.26)" : undefined }}
          onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } activate(square); }}
          onPointerDown={event => down(event, square)}
          onPointerMove={event => {
            const start = drag.current;
            if (!start || start.pointer !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5) return;
            select(start.from); setDragged({ from: start.from, x: event.clientX, y: event.clientY });
          }}
          onPointerUp={up} onPointerCancel={() => { drag.current = null; setDragged(null); }}
        >
          {piece && <span style={{ opacity: dragged?.from === square ? .25 : 1 }}><ChessPiece piece={piece.type} color={piece.color === "w" ? "white" : "black"} size={size / 8 * .85} /></span>}
          {target && <span className={target.captured ? "source-chess-capture-target" : "source-chess-target"} />}
        </button>;
      }))}
      {promotion && <div className="source-chess-promotion" role="dialog" aria-modal="true" aria-label="Promotion"
        onKeyDown={event => { if (event.key === "Escape") setPromotion(null); }}>
        {(["q", "r", "b", "n"] as const).map(piece => <button type="button" key={piece} aria-label={"Promote to " + piece}
          onClick={() => { onMove(promotion.from, promotion.to, piece); setPromotion(null); }}><ChessPiece piece={piece} color={side} size={40} /></button>)}
        <button type="button" onClick={() => setPromotion(null)} aria-label="Cancel promotion">×</button>
      </div>}
    </div>
    <div className="source-chess-files">{[...files].map(file => <span key={file}>{file}</span>)}</div>
    {dragged && (() => { const piece = board.get(dragged.from as Square); return piece ? <div
      style={{ position: "fixed", left: dragged.x, top: dragged.y, transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 100000 }}>
      <ChessPiece piece={piece.type} color={piece.color === "w" ? "white" : "black"} size={size / 8 * .9} />
    </div> : null; })()}
  </div>;
}
