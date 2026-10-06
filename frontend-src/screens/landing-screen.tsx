import { useEffect, useState, type CSSProperties } from "react";
import "./landing-screen.css";

// Recovered IntroPage content and interactions; reference:
// public/assets/IntroPage-BO45BFI5.js, routed by index-CyHAbkO5.js.
// The shipped intro is Chinese-only, not part of the desktop i18n namespace.
const page = {
  title: "NORI_OS",
  logoAlt: "I_NORI",
  tagline: "先导桌面解谜游戏《NORI_OS》",
  requirementsBefore: "仅支持",
  requirementsDevice: "电脑端",
  requirementsAfter: " Chrome 或 Edge，无需安装",
  start: "START",
  note: "首次启动需加载游戏资源，请稍候。",
};
const steam = {
  eyebrow: "Steam",
  headline: "《I_NORI》Steam 页面现已上线",
  body: "先导篇的故事会在完整游戏里继续。喜欢的话，麻烦加个 Steam 愿望单啦！",
  widgetUrl: "https://store.steampowered.com/widget/4996280/",
};
const story = {
  eyebrow: "故事导入",
  source: "《子午线邮报》 · 科技 · 8 月 26 日",
  headline: "「万物皆可计算」：直击弗图姆科技 AlephPro 发布会",
  byline: "记者 马库斯·哈雷维 / 蓝湾",
  photo: "/webAssets/meridian_post/pexels-34774346.jpg",
  photoWidth: 1200,
  photoHeight: 627,
  photoAlt: "弗图姆科技产业技术日，演讲者站在巨幅屏幕前。",
  standfirst: "弗图姆科技在今日发布会上宣布，AlephPro 将带来算力格局的「终局性颠覆」。公司宣称，AlephPro 可同时处理近乎无穷量级的信息，使算力彻底摆脱物理设施的限制，并承诺推动算力普惠。",
  pull: "「在将 AlephPro 接入计算的未来，我们将拥有用之不竭的庞大算力。」",
  closing: "「我们将会消灭 Token 贫困！」发言人的这句话引发了现场长达数十秒的掌声。「所有曾经被算力门槛挡在外面的人，都将被这片海平等地接纳。弗图姆承诺：海的馈赠，属于全人类。」",
};
const play = {
  title: "游玩须知",
  warning: "本作含轻度恐怖、令人不安的内容及闪烁画面，光敏感人群请谨慎游玩。",
  selfContained: "本游戏可以完全不借助现实存在的站点或搜索引擎通关。",
  ai: "本作含有由 AI 驱动的角色，偶尔可能说错话或给出误导性的解谜提示。我们正在持续改进，请在游玩时留意。",
  network: "服务器位于海外，网络连接会影响游玩体验。若加载较慢或操作有延迟，使用 VPN 或加速器可明显改善。",
  fiction: "游戏中的公司、产品、人物及网站均属虚构。部分网站刻意模拟真实页面，其与现实的相似之处均为作品设计。",
};
const contact = {
  title: "联系",
  welcome: "欢迎在 QQ 群提问或反馈 Bug，感谢你的支持。如果 1 群已满，请加 2 群。",
  qqLabel: "Q群1",
  qq: "1041616195",
  qq2Label: "Q群2",
  qq2: "1107531061",
  mailLabel: "邮箱",
  mail: "info@inori.ai",
  bilibiliLabel: "B站",
  bilibili: "space.bilibili.com/326505494",
  bilibiliUrl: "https://space.bilibili.com/326505494",
  copyHint: "点击复制",
  copied: "已复制",
  bookmarkBeforeKeys: "建议",
  bookmarkAfterKeys: "收藏本页，联系方式与服务器公告会在此更新。",
};
const COPIED_DURATION_MS = 1800;

async function copyContact(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // The original uses a selected textarea when clipboard access is denied.
    // This also covers HTTP browsers where the Clipboard API is unavailable.
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
    document.body.append(textarea);
    textarea.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      textarea.remove();
    }
  }
}

function rise(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

export function LandingScreen() {
  const [copied, setCopied] = useState<string | null>(null);
  const bookmarkKeys = /Macintosh|Mac OS X/.test(navigator.userAgent) ? "⌘+D" : "Ctrl+D";
  useEffect(() => {
    const title = document.title;
    const language = document.documentElement.lang;
    document.title = page.title;
    document.documentElement.lang = "zh-CN";
    return () => {
      document.title = title;
      document.documentElement.lang = language;
    };
  }, []);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), COPIED_DURATION_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  function copy(value: string) {
    void copyContact(value).then((success) => {
      if (success) setCopied(value);
    });
  }

  return (
    <div className="intro-root">
      <div aria-hidden="true" className="intro-backdrop">
        <div className="intro-tide" />
      </div>
      <main className="intro-page">
        <header className="intro-hero intro-rise" style={rise(0)}>
          <img className="intro-logo" src="/inori-logo.png" alt={page.logoAlt} draggable={false} />
          <div className="intro-pitch">
            <p className="intro-tagline">{page.tagline}</p>
            <p className="intro-requirements">
              {page.requirementsBefore}<strong>{page.requirementsDevice}</strong>{page.requirementsAfter}
            </p>
          </div>
        </header>
        <section className="intro-section intro-rise" style={rise(1)}>
          <h2 className="intro-eyebrow">{story.eyebrow}</h2>
          <article className="intro-clip">
            <p className="intro-clip-source">{story.source}</p>
            <h3 className="intro-clip-headline">{story.headline}</h3>
            <p className="intro-clip-byline">{story.byline}</p>
            <img
              className="intro-clip-photo"
              src={story.photo}
              width={story.photoWidth}
              height={story.photoHeight}
              alt={story.photoAlt}
              loading="lazy"
              draggable={false}
            />
            <p className="intro-clip-standfirst">{story.standfirst}</p>
            <p className="intro-clip-pull">{story.pull}</p>
            <p className="intro-clip-body">{story.closing}</p>
          </article>
        </section>
        <section className="intro-section intro-rise" style={rise(2)}>
          <h2 className="intro-eyebrow">{steam.eyebrow}</h2>
          <h3 className="intro-steam-headline">{steam.headline}</h3>
          <p className="intro-steam-body">{steam.body}</p>
          <iframe className="intro-steam-widget" src={steam.widgetUrl} title={steam.eyebrow} loading="lazy" />
        </section>
        <section className="intro-section intro-rise" style={rise(3)}>
          <h2 className="intro-eyebrow">{contact.title}</h2>
          <div className="intro-rows">
            <ContactCopy label={contact.qqLabel} value={contact.qq} copied={copied === contact.qq} onCopy={copy} />
            <ContactCopy label={contact.qq2Label} value={contact.qq2} copied={copied === contact.qq2} onCopy={copy} />
            <ContactCopy className="intro-row-small" label={contact.mailLabel} value={contact.mail} copied={copied === contact.mail} onCopy={copy} />
            <a className="intro-row intro-row-small" href={contact.bilibiliUrl} target="_blank" rel="noreferrer">
              <span className="intro-row-label">{contact.bilibiliLabel}</span>
              <span className="intro-row-value">{contact.bilibili}</span>
              <span className="intro-row-hint intro-row-arrow" aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="intro-welcome">{contact.welcome}</p>
          <p className="intro-bookmark">
            {contact.bookmarkBeforeKeys}<span className="intro-kbd">{bookmarkKeys}</span>{contact.bookmarkAfterKeys}
          </p>
        </section>
        <section className="intro-section intro-rise" style={rise(4)}>
          <h2 className="intro-eyebrow">{play.title}</h2>
          <p className="intro-warning">{play.warning}</p>
          <p className="intro-advice intro-success">{play.selfContained}</p>
          <p className="intro-advice">{play.ai}</p>
          <p className="intro-advice">{play.network}</p>
          <p className="intro-fine">{play.fiction}</p>
        </section>
        <footer className="intro-footer intro-rise" style={rise(5)}>
          <button type="button" className="intro-start" onClick={() => window.location.assign("/")}>{page.start}</button>
          <p className="intro-note">{page.note}</p>
        </footer>
      </main>
    </div>
  );
}

function ContactCopy({ label, value, copied, onCopy, className = "" }: {
  label: string;
  value: string;
  copied: boolean;
  onCopy(value: string): void;
  className?: string;
}) {
  return (
    <button type="button" className={`intro-row ${className}`} onClick={() => onCopy(value)}>
      <span className="intro-row-label">{label}</span>
      <span className="intro-row-value">{value}</span>
      <span className="intro-row-hint" data-copied={copied} aria-live="polite">{copied ? contact.copied : contact.copyHint}</span>
    </button>
  );
}
