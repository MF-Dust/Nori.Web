export function PictionaryCover({ locale, open, durationSec, disabled, onDuration, onToggle, onStart, onHelp }: {
  locale: string; open: boolean; durationSec: number; disabled: boolean;
  onDuration(value: number): void; onToggle(): void; onStart(): void; onHelp(): void;
}) {
  const zh = locale.toLowerCase().startsWith("zh"), text = (en: string, cn: string) => zh ? cn : en;
  return <div className="source-pictionary-cover-stage">
    <button type="button" className="source-pictionary-cover-help" aria-label={text("Help", "帮助")} onClick={onHelp}>?</button>
    <div className={`source-pictionary-cover ${open ? "is-open" : ""}`}>
      <div className="source-pictionary-cover-elastic" aria-hidden="true" />
      <div className="source-pictionary-cover-pencil" aria-hidden="true" />
      <div className="source-pictionary-cover-title">
        <small>NORI · SKETCHBOOK</small><h1>{text("Draw & Guess", "你画我猜")}</h1><i />
        <p>{text("Take turns drawing and guessing with Nori.", "与 Nori 轮流画图和猜词。")}</p>
      </div>
      <div className="source-pictionary-mode-cards">
        <article><b aria-hidden="true">✎</b><strong>{text("Draw", "画图")}</strong><span>{text("Sketch the secret word", "画出秘密词语")}</span></article>
        <article><b aria-hidden="true">⌕</b><strong>{text("Guess", "猜词")}</strong><span>{text("Read the changing lines", "观察线条猜答案")}</span></article>
      </div>
      {open && <div className="source-pictionary-duration-note">
        <span>{text("Session duration", "游戏时长")}</span>
        {[120, 180, 300].map(value => <button type="button" key={value} aria-pressed={durationSec === value}
          onClick={() => onDuration(value)}>{value / 60} {text("min", "分钟")}</button>)}
      </div>}
      <button type="button" className="source-pictionary-cover-primary" disabled={open && disabled}
        aria-label={open ? text("Start session", "开始游戏") : text("Play", "开始")}
        onClick={open ? onStart : onToggle}>{open ? text("Start session →", "开始游戏 →") : text("→ Play", "→ 开始")}</button>
      {open && <button type="button" className="source-pictionary-cover-back" onClick={onToggle}>{text("← Back", "← 返回")}</button>}
    </div>
  </div>;
}
