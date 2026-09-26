export function PictionaryCover({ locale, open, durationSec, disabled, onDuration, onToggle, onStart, onHelp }: {
  locale: string; open: boolean; durationSec: number; disabled: boolean;
  onDuration(value: number): void; onToggle(): void; onStart(): void; onHelp(): void;
}) {
  const zh = locale.toLowerCase().startsWith("zh"), text = (en: string, cn: string) => zh ? cn : en;
  return <div className="source-pictionary-cover-stage">
    <span className="source-pictionary-cover-speckles" aria-hidden="true"><i /><i /><i /><i /><i /></span>
    <button type="button" className="source-pictionary-cover-help" aria-label={text("Help", "帮助")} onClick={onHelp}>?</button>
    <div className={`source-pictionary-cover ${open ? "is-open" : ""}`}>
      <div className="source-pictionary-cover-elastic" aria-hidden="true" />
      <div className="source-pictionary-cover-pencil" aria-hidden="true" />
      <div className="source-pictionary-cover-texture" aria-hidden="true" />
      <span className="source-pictionary-coffee-ring" aria-hidden="true" />
      <div className="source-pictionary-cover-title">
        <div className="source-pictionary-foil-title">
          <span aria-hidden="true">{text("Draw & Guess", "你画我猜")}</span>
          <h1>{text("Draw & Guess", "你画我猜")}</h1>
        </div>
        <i />
        <p>{text("with Nori", "与 Nori 一起")}</p>
      </div>
      <div className="source-pictionary-mode-cards">
        <span className="source-pictionary-coffee-ring source-pictionary-card-ring" aria-hidden="true" />
        <article><b aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg></b><strong>{text("DRAW", "画画")}</strong><span>{text("You sketch, Nori guesses", "你画，Nori 猜")}</span><i className="source-pictionary-page-corner" aria-hidden="true" /></article>
        <article><b aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2.5 12c1.5-4 5-7 9.5-7s8 3 9.5 7c-1.5 4-5 7-9.5 7s-8-3-9.5-7z" /><circle cx="12.2" cy="12" r="3" /><circle cx="12.2" cy="12" r="1.2" fill="currentColor" /><circle cx="13.5" cy="10.8" r=".6" fill="white" stroke="none" /></svg></b><strong>{text("GUESS", "猜词")}</strong><span>{text("Nori draws, you guess", "Nori 画，你猜")}</span><i className="source-pictionary-page-corner bottom" aria-hidden="true" /></article>
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
      <div className="source-pictionary-cover-pages" aria-hidden="true" />
    </div>
  </div>;
}
