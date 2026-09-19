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
        <div className="source-pictionary-foil-title">
          <span aria-hidden="true">{text("Draw & Guess", "你画我猜")}</span>
          <h1>{text("Draw & Guess", "你画我猜")}</h1>
        </div>
        <i />
        <p>{text("with Nori", "与 Nori 一起")}</p>
      </div>
      <div className="source-pictionary-mode-cards">
        <article><b aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg></b><strong>{text("DRAW", "画画")}</strong><span>{text("You sketch, Nori guesses", "你画，Nori 猜")}</span></article>
        <article><b aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2.1 12a10 10 0 0 1 19.8 0 10 10 0 0 1-19.8 0Z" /><circle cx="12" cy="12" r="3" /></svg></b><strong>{text("GUESS", "猜词")}</strong><span>{text("Nori draws, you guess", "Nori 画，你猜")}</span></article>
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
