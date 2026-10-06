import { useEffect, useRef, useState, type ReactNode } from "react";
import { computeFileRecoveryProgress, isRecoveredFile, type FilesRecoveredFile } from "../apps/files";
import { getEffectiveDesktopCompute, type DesktopComputeState } from "../state/compute-runtime";
import "./qfr-dock.css";

export interface QfrDockRuntime {
  computeState(): DesktopComputeState;
  facts(): ReadonlySet<string>;
  subscribe?: (listener: () => void) => () => void;
  maxComputeThisRun?: () => number;
  reduceMotion?: () => boolean;
  suspended?: () => boolean;
}

export interface QfrDockViewProps {
  files: readonly FilesRecoveredFile[];
  facts: ReadonlySet<string>;
  computeState: DesktopComputeState;
  maxComputeThisRun?: number;
  reduceMotion?: boolean;
  suspended?: boolean;
}

const LOGO = String.raw` ██████╗ ███████╗██████╗  █████╗  ██████╗  ██████╗  ██████╗
██╔═══██╗██╔════╝██╔══██╗██╔══██╗██╔═████╗██╔═████╗██╔═████╗
██║   ██║█████╗  ██████╔╝╚██████║██║██╔██║██║██╔██║██║██╔██║
██║▄▄ ██║██╔══╝  ██╔══██╗ ╚═══██║████╔╝██║████╔╝██║████╔╝██║
╚██████╔╝██║     ██║  ██║ █████╔╝╚██████╔╝╚██████╔╝╚██████╔╝
 ╚══▀▀═╝ ╚═╝     ╚═╝  ╚═╝ ╚════╝  ╚═════╝  ╚═════╝  ╚═════╝`;
const RUN_LOG = [
  "shor: stage modexp  toffoli 3.14e9/6.50e9  reg 1409 d=25",
  "shor: period-find reg 4128 qubits  ccz 6/6 busy",
  "shor: shot 4/~9  postproc continued-fraction ... miss requeue",
  "magic-state: cultivation 14.7 rnd/T  hot-store 131q occ 0.91",
  "gnfs sieve  q=0x9F3A  rel 4.21M/s  yield 38%",
  "gnfs linalg  block-wiedemann iter 188k/512k",
  "lattice BKZ-44  block 901/1024  norm shrink 0.97",
  "lwe: gso profile flattening  b1/target 1.84",
  "header parse  XTS-AES-256  sector size 512",
  "VMK unwrap  AES-KW RFC3394  ok",
  "FVEK derive  XTS-AES-256  tweak 0x0A77",
  "private-key recover  RSA exponent d  bit 1810/2048",
  "surface-code d=25  logical err 3e-9",
  "checkpoint write  state 0x18  resume safe",
];
const SUSP_LOG = [
  "factor-4096: HELD reason=Resources  ETA n/a",
  "shor: STALLED  modulus exceeds logical-qubit budget",
  "magic-state: throughput-bound under ceiling",
  "scheduler: jobs PENDING(Resources)  raise ceiling to proceed",
];
const DONE_LOG = [
  "shor: all target moduli factored  workers released",
  "magic-state: cultivation halted  hot-store drained",
  "scheduler: queue empty  all jobs retired",
  "checkpoint final write  state sealed",
  "qfr: recovery complete  RSRCH-COLD-VOL readable",
];

interface QfrHintSegment {
  branch: string;
  label: string;
  identified: boolean;
  resolved: boolean;
  lines: string[];
}

/** The four shipped Chinese hint segments; no English replacement copy. */
export function qfrCapHints(facts: ReadonlySet<string>, atCap: boolean) {
  const has = (fact: string) => facts.has(fact);
  const sealDone = has("arg.seal_released");
  const gesturesDone = has("arg.gestures_complete");
  const bountyDone = has("arg.honeypot_access");
  const cultDone = has("cult.unpacked");
  const sealLines = sealDone
    ? ["口令已验证；封印已解除。"]
    : has("recover.seal_config") && has("recover.tower_photo")
      ? [`本机状态显示，一小部分算力被人为锁定，认证接口正在监听。口令格式为六个字母英文单词。线索文件当前阅读进度为 ${["file.seal_config.read", "file.tower_photo.read"].filter(has).length}/2。`]
      : [];
  const gestureLabels = [
    ["gesture.chess", "国际象棋"], ["gesture.codenames", "森林寻宝"],
    ["gesture.pictionary", "你画我猜"], ["gesture.cakeduel", "蛋糕对决"],
  ];
  const gestureLines = gesturesDone
    ? ["四次超限峰值均已复现；受限算力段已并入主算力池。"]
    : has("recover.overclock_log")
      ? [`负载日志；四个交互模块各一次超限峰值；模式判定：可复现。复现状态：${gestureLabels.map(([fact, label]) => `${label} ${has(fact) ? 1 : 0}/1`).join("；")}。线索文件：《关于算力超限的偶然事件.txt》。`]
      : [];
  const submitted = Math.min(5, ["dirt.frank", "dirt.maggie", "dirt.jack", "dirt.hanyue_ssh", "dirt.daniel", "dirt.futurum_aleph_obs"].filter(has).length);
  const unsubmitted = [
    ["futurum.doc2.downloaded", "dirt.futurum_aleph_obs"],
    ["download.hanyue_consent", "dirt.hanyue_ssh"],
    ["daniel.retraction.downloaded", "dirt.daniel"],
  ].filter(([download, submission]) => has(download) && !has(submission)).length;
  const bountyLines = bountyDone
    ? ["已被授予蜜罐访问权；算力收割程序已部署。"]
    : has("bounty.ext_installed")
      ? [`检测到通过交换材料换取的外部算力源；本机提交通道已建立；材料 ${submitted}/5。`, ...(unsubmitted ? [`本机检测到 ${unsubmitted} 份已下载但尚未提交的材料。`] : [])]
      : has("driftnet.bounty.read")
        ? ["检测到通过交换材料换取的外部算力源；本机提交通道未建立；插件安装可建立通道。"]
        : [];
  const cultLines = cultDone
    ? ["寄生活性已终止；受限算力段已并入主算力池；提取目录为空。"]
    : has("cult.zip.downloaded")
      ? ["当前对象受六位数字口令保护；本机无对应记录。", "检测结束。", "检测结束。检测结束。检测" + "宇宙真相".repeat(88)]
      : [];
  const segments: QfrHintSegment[] = [
    { branch: "seal", label: "线索：认证接口", identified: has("recover.seal_config") || sealLines.length > 0, resolved: sealDone, lines: sealLines },
    { branch: "gestures", label: "线索：超限模式", identified: has("recover.overclock_log") || gestureLines.length > 0, resolved: gesturesDone, lines: gestureLines },
    { branch: "bounty", label: "线索：外源通道", identified: has("driftnet.bounty.read") || bountyLines.length > 0, resolved: bountyDone, lines: bountyLines },
    { branch: "cult", label: "线索：认知寄生", identified: has("cult.zip.downloaded") || cultLines.length > 0, resolved: cultDone, lines: cultLines },
  ];
  return {
    header: atCap || has("compute.at_cap") ? "算力达到上限；增长停止。" : "算力增长中。",
    segments: segments.map((segment) => segment.identified ? segment : {
      ...segment, label: "？？？", lines: ["检测到受限算力段；特征数据不足；来源未解析。"],
    }),
  };
}

function logTime(index: number): string {
  const seconds = 14 + index * 4;
  return `t+${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function QfrLog({ complete, suspended, running, reduceMotion }: { complete: boolean; suspended: boolean; running: boolean; reduceMotion: boolean }) {
  const [lines, setLines] = useState<string[]>([]);
  const count = useRef(0);
  const state = useRef({ suspended, running });
  state.current = { suspended, running };
  useEffect(() => {
    if (reduceMotion) {
      const rows = complete ? DONE_LOG.slice(-3) : RUN_LOG.slice(0, 3);
      setLines(rows.map((line, index) => `${logTime(index)}  ${line}`));
      count.current = 3;
      return;
    }
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (complete && index >= DONE_LOG.length) return;
      const rows = complete ? DONE_LOG : state.current.suspended ? SUSP_LOG : state.current.running ? RUN_LOG : [];
      if (rows.length) {
        const line = `${logTime(count.current++)}  ${rows[index++ % rows.length]}`;
        setLines((previous) => [...previous, line].slice(-3));
      }
      timer = setTimeout(tick, 380 + (index % 5) * 40);
    };
    timer = setTimeout(tick, 360);
    return () => clearTimeout(timer);
  }, [complete, reduceMotion]);
  return <section className="qfr-panel qfr-log"><div className="qfr-row qfr-panel-title"><span>作业日志</span><span className="qfr-dim">qfr.recover</span></div>{lines.map((line, index) => <div key={`${index}:${line}`} className="qfr-log-line">{line}</div>)}</section>;
}

function QfrProgress({ label, fraction, value }: { label: string; fraction: number; value: string }) {
  const filled = Math.round(Math.max(0, Math.min(1, fraction)) * 16);
  return <div className="qfr-row"><span className="qfr-dim">{label}</span><span><span className="qfr-muted">[</span>{"█".repeat(filled)}<span className="qfr-muted">{"░".repeat(16 - filled)}]</span> {value}</span></div>;
}

export function QfrDockView({ files, facts, computeState, maxComputeThisRun = computeState.compute, reduceMotion = false, suspended: forceSuspended = false }: QfrDockViewProps) {
  const effective = getEffectiveDesktopCompute(computeState);
  const recovered = files.filter(isRecoveredFile).length;
  const complete = files.length > 0 && recovered === files.length;
  const progress = files.map((file) => ({
    recovered: isRecoveredFile(file),
    ...computeFileRecoveryProgress(file.threshold, maxComputeThisRun, effective.cap),
  }));
  const aggregate = files.length ? Math.round(progress.reduce((sum, item, index) => sum + (item.recovered ? 100 : files[index].threshold == null ? 0 : item.pct), 0) / files.length) : 0;
  const suspended = forceSuspended || progress.some((item) => !item.recovered && item.stalled);
  const running = progress.some((item) => !item.recovered && !item.stalled && item.pct > 0 && item.pct < 100);
  const atCap = Number.isFinite(effective.cap) && computeState.compute >= effective.cap;
  const status = suspended ? "SUSP" : complete ? "DONE" : "RUN";
  const hints = qfrCapHints(facts, atCap);

  return <aside className={`qfr-dock${suspended ? " qfr-suspended" : ""}${complete ? " qfr-complete" : ""}${reduceMotion ? " qfr-reduce-motion" : ""}`} aria-label="QUANTUM FILE RECOVERY 9000" onWheelCapture={(event) => event.stopPropagation()}>
    <div className="qfr-term"><div className="qfr-host qfr-content">
      <header className="qfr-heading"><pre aria-hidden="true">{LOGO}</pre><div className="qfr-dim qfr-truncate">QUANTUM FILE RECOVERY 9000  v9.0.0  量子文件恢复仪</div><div className="qfr-muted">driftnet 论坛荣誉出品</div></header>
      <section className="qfr-panel"><div className="qfr-row qfr-panel-title"><span>恢复总线</span><span className="qfr-dim">{status}</span></div><div className="qfr-row"><span className="qfr-dim">目标卷</span><span>RSRCH-COLD-VOL</span></div><div className="qfr-row qfr-dim"><span>恢复方式</span><span>SHOR ROUTINE</span></div><div className="qfr-progress"><QfrProgress label="已恢复" fraction={files.length ? recovered / files.length : 0} value={`${recovered} / ${files.length}`} /><QfrProgress label="进度  " fraction={aggregate / 100} value={`${aggregate}%`} /></div>{suspended ? <><div>受算力限制，请提高上限。</div><div>需要提高算力上限？来论坛找我们吧！</div></> : null}</section>
      <section className="qfr-panel"><div className="qfr-row qfr-panel-title"><span>算力提升线索</span><span className={atCap ? "qfr-amber" : "qfr-dim"}>{hints.header}</span></div>{hints.segments.map((segment) => <div key={segment.branch} className="qfr-hint"><div className={segment.identified ? undefined : "qfr-dim"}>{segment.resolved ? "✓" : "▸"} {segment.label}</div><div className={segment.identified ? "qfr-hint-lines qfr-dim" : "qfr-hint-lines qfr-muted"}>{segment.lines.map((line, index) => <div key={index}>{line}</div>)}</div></div>)}</section>
      <QfrLog complete={complete} suspended={suspended} running={running} reduceMotion={reduceMotion} />
    </div></div>
    <div className="qfr-status"><div className="qfr-host qfr-row qfr-status-line"><span className="qfr-status-badge"> {status} </span><span className="qfr-dim qfr-truncate">qfr-9000@RSRCH-COLD-VOL</span><span>q {files.length - recovered} ▲ {recovered}</span></div></div>
  </aside>;
}

export function QfrDock({ files, runtime }: { files: readonly FilesRecoveredFile[]; runtime: QfrDockRuntime }) {
  const [, setVersion] = useState(0);
  useEffect(() => runtime.subscribe?.(() => setVersion((value) => value + 1)), [runtime]);
  return <QfrDockView files={files} facts={runtime.facts()} computeState={runtime.computeState()} maxComputeThisRun={runtime.maxComputeThisRun?.()} reduceMotion={runtime.reduceMotion?.() ?? false} suspended={runtime.suspended?.() ?? false} />;
}

export function createQfrColdVolumeDockRenderer(runtime: QfrDockRuntime) {
  return (files: readonly FilesRecoveredFile[]): ReactNode => <QfrDock files={files} runtime={runtime} />;
}
