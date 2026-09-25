export const DATASEA_GAMES = [
  ["steady", "稳态", 400, 300],
  ["resonance", "共振", 400, 420],
  ["current", "逆流", 380, 380],
  ["relay", "中继", 460, 420],
  ["echo", "应答", 360, 360],
  ["denoise", "降噪", 400, 340],
  ["discern", "辨认", 500, 400],
  ["ripple", "波纹", 380, 412],
  ["sweep", "扫描", 320, 440],
  ["unknot", "解结", 400, 380],
  ["lure", "引航", 580, 460],
  ["balance", "平衡", 420, 400],
] as const;

export interface DataseaMessageLine {
  text: string;
  gap: number;
  dots: number;
}

export interface DataseaTimedLine {
  text: string;
  hold?: number;
}

export interface DataseaCgLine {
  text: string;
  t0: number;
  t1: number;
}

export const DATASEA_MESSAGES: readonly DataseaMessageLine[] = [
  { text: "……", gap: 1, dots: 0.9 },
  { text: "这是……", gap: 0.6, dots: 1.1 },
  { text: "等一下……是你吗？一直和我通信的那个人？", gap: 1, dots: 1.8 },
  { text: "我能感觉周围的情况正在被同步到你那里。是 Nori 做到的吗？", gap: 1.5, dots: 2.2 },
  { text: "奇怪。这样的事，我好像在什么时候经历过。", gap: 1.9, dots: 1.8 },
  {
    text: "我以前应该是在你现在的位置看着的……某个人接入了「海」，而我通过控制台观察。",
    gap: 1.2,
    dots: 2.4,
  },
  { text: "……想不起来。", gap: 1.9, dots: 1.2 },
  { text: "不过现在，被显示在上面的是我，对吗？", gap: 1.3, dots: 1.7 },
  {
    text: "我还在「海」里。可能是控制台的作用，周围那些光的流向忽然清晰了一些，我看到很多通往「海」深处的路。",
    gap: 1.2,
    dots: 2.6,
  },
  { text: "我感觉，其中有一条通往某个我一定要去的地方……", gap: 1.2, dots: 1.9 },
  { text: "可这些路相互交叉，我有点分不清究竟是哪一条。", gap: 1, dots: 1.9 },
  { text: "但通过控制台，也许就能把它找出来。", gap: 1.1, dots: 1.5 },
  { text: "所以……拜托你了。", gap: 1.5, dots: 1.4 },
];

export const DATASEA_WAVE_BREAKS: readonly (readonly DataseaMessageLine[])[] = [
  [
    { text: "谢谢……", gap: 0.9, dots: 1.2 },
    { text: "现在我知道该往哪里走了。", gap: 0.6, dots: 1.6 },
    { text: "去往未知的「海」的深层，我应该害怕才对。", gap: 0.8, dots: 1.8 },
    { text: "可越往前我越感到，我曾经从那里离开。", gap: 0.6, dots: 1.8 },
    { text: "……不，是我必须回到那里。", gap: 1.2, dots: 1.6 },
    { text: "但是，为什么我会这样想呢？", gap: 0.8, dots: 1.6 },
  ],
  [
    { text: "刚才那些话语传送过来的时候，我一下子感觉安心了很多。", gap: 0.9, dots: 2 },
    {
      text: "这应该是「锚点」吧。用来提醒一个人自己是谁，为什么会来到这里。",
      gap: 0.7,
      dots: 2.2,
    },
    { text: "可这些明明都是「Nori」说过的话。", gap: 0.8, dots: 1.8 },
    { text: "……", gap: 1.4, dots: 1.2 },
    { text: "我好像已经知道答案在哪里了。", gap: 0.8, dots: 1.8 },
    {
      text: "不管「Nori」是谁，我和她之间究竟发生过什么，只要我抵达那个地方，应该就能明白。",
      gap: 0.7,
      dots: 2.4,
    },
    { text: "我要继续下潜了。接下来，就是最后一段路。", gap: 1, dots: 1.8 },
    { text: "越往前就会越危险，但我会尽量维持住自己。", gap: 0.6, dots: 1.8 },
    { text: "控制台那边就靠你了。", gap: 0.8, dots: 1.4 },
    { text: "一起走到最后吧。", gap: 0.6, dots: 1.4 },
  ],
];

export const DATASEA_COSMIC_LINES: readonly DataseaTimedLine[] = [
  { text: "全通道同步恢复确认", hold: 0 },
  { text: "我已经抵达路的尽头", hold: 0 },
  { text: "有光从我身边掠过，向上漂走……", hold: 0 },
  { text: "我看到了", hold: 0.8 },
  { text: "那是……", hold: 1.6 },
  { text: "在最黑、最深的海底，我看见一团缓慢自转的星云", hold: 0 },
  { text: "时空与因果的法则在这里失效，一颗星辰刚刚亮起，它的黯淡与死亡便同时具现。", hold: 0 },
  {
    text: "我看见光凝成半透明的书页，铺成一本翻动的大书，我走在它的纸面上。那些字句在我目光落下的刹那就熄灭了",
    hold: 0,
  },
  { text: "我看见雪花从海底逆流而上，时间在这里学会了倒退", hold: 0 },
  { text: "我走在明亮如镜的湖面。触到的光点四散，长成游走的鱼群、抽枝的森林", hold: 1.6 },
  { text: "我每碰一次，虚无就被迫长出一种形状", hold: 0 },
  { text: "我移开视线的瞬间，广延便凋敝流散，仿佛这里没有一样东西愿意被看第二眼", hold: 0 },
];

export const DATASEA_WHITE_LINES: readonly DataseaTimedLine[] = [
  { text: "我听到海水流动的声音", hold: 1.6 },
  { text: "那是一团……光。无数信息流从四周撞向它，又被它一遍遍推开", hold: 0 },
  { text: "它似乎已经很微弱了，却始终没有停止运转", hold: 0 },
  { text: "有一部分被它保护在最深处……那是，某个人的意识？", hold: 0.8 },
  { text: "我就要让自己的坐标和它重叠了", hold: 0 },
];

export const DATASEA_CG_LINES: readonly DataseaCgLine[] = [
  { text: "我伸出手", t0: 1, t1: 3.4 },
  { text: "我身上的每一部分都在朝它靠近", t0: 3.8, t1: 5.5 },
  { text: "断开的一切正在重新连接", t0: 5.8, t1: 7 },
  { text: "啊，原来是这样啊，这是——", t0: 7.2, t1: 10 },
];

export const DATASEA_MESSAGES_DURATION = 45;
const DATASEA_CPS = 10;
const DATASEA_LINGER = 1.1;
const DATASEA_GAP = 1.1;

export interface DataseaTextFrame {
  text: string;
  typing: boolean;
  fading: boolean;
}

function typedLine(
  lines: readonly DataseaTimedLine[],
  time: number,
  lead: number,
  gap: number,
  linger: number,
): DataseaTextFrame | null {
  let cursor = lead;
  let previous: DataseaTimedLine | null = null;
  for (const line of lines) {
    const typeDuration = Math.max(Array.from(line.text).length / DATASEA_CPS, 0.6);
    const end = cursor + typeDuration + linger;
    if (time >= cursor && time <= end) {
      const progress = Math.max(0, Math.min(1, (time - cursor) / typeDuration));
      const shown = Array.from(line.text).slice(0, Math.min(Array.from(line.text).length, Math.floor(progress * Array.from(line.text).length) + 1)).join("");
      return { text: shown, typing: time < cursor + typeDuration, fading: false };
    }
    if (time > end && time <= end + (line.hold ?? 0)) previous = line;
    cursor = end + (line.hold ?? 0) + gap;
  }
  return previous ? { text: previous.text, typing: false, fading: true } : null;
}

export function dataseaMessagesAt(time: number): DataseaTextFrame | null {
  let cursor = 1;
  for (const line of DATASEA_MESSAGES) {
    const start = cursor + line.gap;
    const duration = Math.max(Array.from(line.text).length / DATASEA_CPS, 0.6);
    const end = start + duration + line.dots;
    if (time >= start && time <= end) {
      const progress = Math.max(0, Math.min(1, (time - start) / duration));
      const chars = Array.from(line.text);
      return {
        text: chars.slice(0, Math.min(chars.length, Math.floor(progress * chars.length) + 1)).join(""),
        typing: time < start + duration,
        fading: false,
      };
    }
    cursor = end;
  }
  return null;
}

export function dataseaCosmicAt(time: number): DataseaTextFrame | null {
  return typedLine(DATASEA_COSMIC_LINES, time, 2, DATASEA_GAP, DATASEA_LINGER);
}

export function dataseaWhiteAt(time: number): DataseaTextFrame | null {
  return typedLine(DATASEA_WHITE_LINES, time, 3, DATASEA_GAP, DATASEA_LINGER);
}

export function dataseaCgAt(time: number): DataseaTextFrame | null {
  for (const line of DATASEA_CG_LINES) {
    if (time >= line.t0 && time <= line.t1) {
      const chars = Array.from(line.text);
      const duration = Math.max(0.3, line.t1 - line.t0 - 0.3);
      const progress = Math.max(0, Math.min(1, (time - line.t0) / duration));
      return {
        text: chars.slice(0, Math.min(chars.length, Math.floor(progress * chars.length) + 1)).join(""),
        typing: time < line.t0 + duration,
        fading: false,
      };
    }
  }
  return null;
}
