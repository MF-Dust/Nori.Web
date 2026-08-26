import { j as e, i as x } from "./index-CyHAbkO5.js";
import { r as p } from "./i18n-DtIC1LRi.js";
const l = {
    pageTitle: "NORI_OS",
    logoAlt: "I_NORI",
    tagline: "先导桌面解谜游戏《NORI_OS》",
    requirementsBefore: "仅支持",
    requirementsDevice: "电脑端",
    requirementsAfter: " Chrome 或 Edge，无需安装",
    start: "START",
    note: "首次启动需加载游戏资源，请稍候。",
    mobileTitle: "手机端无法运行",
    mobileBody:
      "请用电脑打开本页面游玩！手机浏览器切换到「电脑版网页」也无法正常游玩！作者只有一个肝，肝不动手机端适配了 TT",
  },
  d = {
    eyebrow: "Steam",
    headline: "《I_NORI》Steam 页面现已上线",
    body: "先导篇的故事会在完整游戏里继续。喜欢的话，麻烦加个 Steam 愿望单啦！",
    widgetUrl: "https://store.steampowered.com/widget/4996280/",
  },
  o = {
    eyebrow: "故事导入",
    source: "《子午线邮报》 · 科技 · 8 月 26 日",
    headline: "「万物皆可计算」：直击弗图姆科技 AlephPro 发布会",
    byline: "记者 马库斯·哈雷维 / 蓝湾",
    photo: "/webAssets/meridian_post/pexels-34774346.jpg",
    photoWidth: 1200,
    photoHeight: 627,
    photoAlt: "弗图姆科技产业技术日，演讲者站在巨幅屏幕前。",
    standfirst:
      "弗图姆科技在今日发布会上宣布，AlephPro 将带来算力格局的「终局性颠覆」。公司宣称，AlephPro 可同时处理近乎无穷量级的信息，使算力彻底摆脱物理设施的限制，并承诺推动算力普惠。",
    pull: "「在将 AlephPro 接入计算的未来，我们将拥有用之不竭的庞大算力。」",
    closing:
      "「我们将会消灭 Token 贫困！」发言人的这句话引发了现场长达数十秒的掌声。「所有曾经被算力门槛挡在外面的人，都将被这片海平等地接纳。弗图姆承诺：海的馈赠，属于全人类。」",
  },
  a = {
    title: "游玩须知",
    warning: "本作含轻度恐怖、令人不安的内容及闪烁画面，光敏感人群请谨慎游玩。",
    selfContained: "本游戏可以完全不借助现实存在的站点或搜索引擎通关。",
    ai: "本作含有由 AI 驱动的角色，偶尔可能说错话或给出误导性的解谜提示。我们正在持续改进，请在游玩时留意。",
    network:
      "服务器位于海外，网络连接会影响游玩体验。若加载较慢或操作有延迟，使用 VPN 或加速器可明显改善。",
    fiction:
      "游戏中的公司、产品、人物及网站均属虚构。部分网站刻意模拟真实页面，其与现实的相似之处均为作品设计。",
  },
  i = {
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
  },
  h = x(),
  u = /Macintosh|Mac OS X/.test(navigator.userAgent) ? "⌘+D" : "Ctrl+D",
  N = 1800;
function j() {
  window.location.assign("/");
}
function y(s) {
  return navigator.clipboard.writeText(s).then(
    () => !0,
    () => {
      const t = document.createElement("textarea");
      ((t.value = s),
        t.setAttribute("readonly", ""),
        (t.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0"),
        document.body.append(t),
        t.select());
      let r = !1;
      try {
        r = document.execCommand("copy");
      } catch {
        r = !1;
      }
      return (t.remove(), r);
    },
  );
}
function c(s) {
  return { "--i": s };
}
function f() {
  const [s, t] = p.useState(null);
  (p.useEffect(() => {
    const n = document.title;
    return (
      (document.title = l.pageTitle),
      () => {
        document.title = n;
      }
    );
  }, []),
    p.useEffect(() => {
      if (!s) return;
      const n = setTimeout(() => t(null), N);
      return () => clearTimeout(n);
    }, [s]));
  const r = p.useCallback((n) => {
    y(n).then((m) => {
      m && t(n);
    });
  }, []);
  return e.jsxs("div", {
    className: "intro-root",
    children: [
      e.jsx("div", {
        "aria-hidden": !0,
        className: "intro-backdrop",
        children: e.jsx("div", { className: "intro-tide" }),
      }),
      e.jsxs("main", {
        className: "intro-page",
        children: [
          e.jsxs("header", {
            className: "intro-hero intro-rise",
            style: c(0),
            children: [
              e.jsx("img", {
                className: "intro-logo",
                src: "/inori-logo.png",
                alt: l.logoAlt,
                draggable: !1,
              }),
              e.jsxs("div", {
                className: "intro-pitch",
                children: [
                  e.jsx("p", { className: "intro-tagline", children: l.tagline }),
                  e.jsxs("p", {
                    className: "intro-requirements",
                    children: [
                      l.requirementsBefore,
                      e.jsx("strong", { children: l.requirementsDevice }),
                      l.requirementsAfter,
                    ],
                  }),
                ],
              }),
              h
                ? e.jsxs("div", {
                    className: "intro-unsupported",
                    children: [
                      e.jsx("p", { className: "intro-unsupported-title", children: l.mobileTitle }),
                      e.jsx("p", { className: "intro-unsupported-body", children: l.mobileBody }),
                    ],
                  })
                : null,
            ],
          }),
          e.jsxs("section", {
            className: "intro-section intro-rise",
            style: c(1),
            children: [
              e.jsx("h2", { className: "intro-eyebrow", children: o.eyebrow }),
              e.jsxs("article", {
                className: "intro-clip",
                children: [
                  e.jsx("p", { className: "intro-clip-source", children: o.source }),
                  e.jsx("h3", { className: "intro-clip-headline", children: o.headline }),
                  e.jsx("p", { className: "intro-clip-byline", children: o.byline }),
                  e.jsx("img", {
                    className: "intro-clip-photo",
                    src: o.photo,
                    width: o.photoWidth,
                    height: o.photoHeight,
                    alt: o.photoAlt,
                    loading: "lazy",
                    draggable: !1,
                  }),
                  e.jsx("p", { className: "intro-clip-standfirst", children: o.standfirst }),
                  e.jsx("p", { className: "intro-clip-pull", children: o.pull }),
                  e.jsx("p", { className: "intro-clip-body", children: o.closing }),
                ],
              }),
            ],
          }),
          e.jsxs("section", {
            className: "intro-section intro-rise",
            style: c(2),
            children: [
              e.jsx("h2", { className: "intro-eyebrow", children: d.eyebrow }),
              e.jsx("h3", { className: "intro-steam-headline", children: d.headline }),
              e.jsx("p", { className: "intro-steam-body", children: d.body }),
              e.jsx("iframe", {
                className: "intro-steam-widget",
                src: d.widgetUrl,
                title: d.eyebrow,
                loading: "lazy",
              }),
            ],
          }),
          e.jsxs("section", {
            className: "intro-section intro-rise",
            style: c(3),
            children: [
              e.jsx("h2", { className: "intro-eyebrow", children: i.title }),
              e.jsxs("div", {
                className: "intro-rows",
                children: [
                  e.jsx(b, { label: i.qqLabel, value: i.qq, copied: s === i.qq, onCopy: r }),
                  e.jsx(b, { label: i.qq2Label, value: i.qq2, copied: s === i.qq2, onCopy: r }),
                  e.jsx(b, {
                    className: "intro-row-small",
                    label: i.mailLabel,
                    value: i.mail,
                    copied: s === i.mail,
                    onCopy: r,
                  }),
                  e.jsxs("a", {
                    className: "intro-row intro-row-small",
                    href: i.bilibiliUrl,
                    target: "_blank",
                    rel: "noreferrer",
                    children: [
                      e.jsx("span", { className: "intro-row-label", children: i.bilibiliLabel }),
                      e.jsx("span", { className: "intro-row-value", children: i.bilibili }),
                      e.jsx("span", {
                        className: "intro-row-hint intro-row-arrow",
                        "aria-hidden": !0,
                        children: "↗",
                      }),
                    ],
                  }),
                ],
              }),
              e.jsx("p", { className: "intro-welcome", children: i.welcome }),
              e.jsxs("p", {
                className: "intro-bookmark",
                children: [
                  i.bookmarkBeforeKeys,
                  h ? null : e.jsx("span", { className: "intro-kbd", children: u }),
                  i.bookmarkAfterKeys,
                ],
              }),
            ],
          }),
          e.jsxs("section", {
            className: "intro-section intro-rise",
            style: c(4),
            children: [
              e.jsx("h2", { className: "intro-eyebrow", children: a.title }),
              e.jsx("p", { className: "intro-warning", children: a.warning }),
              e.jsx("p", { className: "intro-advice intro-success", children: a.selfContained }),
              e.jsx("p", { className: "intro-advice", children: a.ai }),
              e.jsx("p", { className: "intro-advice", children: a.network }),
              e.jsx("p", { className: "intro-fine", children: a.fiction }),
            ],
          }),
          h
            ? null
            : e.jsxs("footer", {
                className: "intro-footer intro-rise",
                style: c(5),
                children: [
                  e.jsx("button", {
                    type: "button",
                    className: "intro-start",
                    onClick: j,
                    children: l.start,
                  }),
                  e.jsx("p", { className: "intro-note", children: l.note }),
                ],
              }),
        ],
      }),
    ],
  });
}
function b({ label: s, value: t, copied: r, onCopy: n, className: m }) {
  return e.jsxs("button", {
    type: "button",
    className: m ? `intro-row ${m}` : "intro-row",
    onClick: () => n(t),
    children: [
      e.jsx("span", { className: "intro-row-label", children: s }),
      e.jsx("span", { className: "intro-row-value", children: t }),
      e.jsx("span", {
        className: "intro-row-hint",
        "data-copied": r,
        children: r ? i.copied : i.copyHint,
      }),
    ],
  });
}
export { f as IntroPage };
