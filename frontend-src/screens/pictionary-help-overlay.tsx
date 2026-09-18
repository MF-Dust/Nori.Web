import { useEffect, useRef } from "react";

const sections = [
  ["Goal", "Solve as many words as possible before the sketchbook timer runs out."],
  ["Take turns", "You and Nori alternate between drawing and guessing after every word or skip."],
  ["When you draw", "Use the pencils, eraser, undo and clear controls. Nori sees the current drawing snapshot."],
  ["When you guess", "Watch Nori draw, type a guess in the notebook, or skip to move to the next word."],
] as const;
const sectionsZh = [
  ["目标", "在速写本计时结束前，尽可能猜出更多词语。"],
  ["轮流进行", "每个词语完成或跳过后，你和 Nori 会交换绘画与猜词角色。"],
  ["轮到你画", "可以使用铅笔、橡皮、撤销和清空。Nori 会看到当前画稿的快照。"],
  ["轮到你猜", "观察 Nori 的画，在笔记本中输入答案，也可以跳过并进入下一个词。"],
] as const;

export function PictionaryHelpOverlay({ locale, onClose }: { locale: string; onClose(): void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const zh = locale.toLowerCase().startsWith("zh"), copy = zh ? sectionsZh : sections;
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.current?.focus();
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); onClose(); } };
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("keydown", close); previous?.focus(); };
  }, [onClose]);
  return <div className="source-pictionary-help-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialog} className="source-pictionary-help-sheet" role="dialog" aria-modal="true"
      aria-label={zh ? "你画我猜玩法" : "Draw & Guess help"} tabIndex={-1}>
      <div className="source-pictionary-help-tape" aria-hidden="true" />
      <header><div><h2>{zh ? "玩法" : "How to play"}</h2><i /></div>
        <button type="button" aria-label={zh ? "关闭帮助" : "Close help"} onClick={onClose}>×</button></header>
      <ol>{copy.map(([title, body], index) => <li key={title}><span>{index + 1}.</span><div><strong>{title}</strong><p>{body}</p></div></li>)}</ol>
    </div>
  </div>;
}
