import assert from "node:assert/strict";

const HANDLED = new Set(["sweep", "unknot", "relay", "echo", "current", "lure", "ripple", "balance"]);
let currentWaveObservedAt = null;

async function advance(page, milliseconds) {
  await page.clock.runFor(milliseconds);
}

async function rootFor(page, id) {
  const root = page.locator(`.datasea-game[data-game="${id}"]`);
  assert.equal(await root.count(), 1, `expected one mounted Datasea ${id} game`);
  const titlebar = root.locator("xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' datasea-wave-window ')][1]").locator(".datasea-wave-titlebar");
  if (await titlebar.count()) {
    const box = await titlebar.boundingBox();
    if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }
  return root;
}

async function waitSolved(page, root, id, timeout = 5000) {
  for (let elapsed = 0; elapsed <= timeout; elapsed += 50) {
    if (await root.count()) {
      if ((await root.getAttribute("data-solved")) === "true") return;
    } else if (await page.locator(".datasea-wave-break").count()) return;
    await advance(page, 50);
  }
  assert.ok(
    (!(await root.count()) && (await page.locator(".datasea-wave-break").count()) > 0) ||
      (await root.getAttribute("data-solved")) === "true",
    `${id} did not report a real gameplay solve`,
  );
}

async function canvasBox(root) {
  const canvas = root.locator("canvas").first();
  const box = await canvas.boundingBox();
  assert.ok(box && box.width > 0 && box.height > 0, "Datasea game canvas has no layout box");
  return { canvas, box };
}

async function solveSweep(page, root) {
  const { canvas, box } = await canvasBox(root);
  for (let level = 0; level < 6; level += 1) {
    let foundGap = false;
    for (let elapsed = 0; elapsed < 5000; elapsed += 12) {
      const brightRatio = await canvas.evaluate((element, currentLevel) => {
        const context = element.getContext("2d");
        const rect = element.getBoundingClientRect();
        const scaleX = element.width / rect.width;
        const scaleY = element.height / rect.height;
        const spacing = (rect.height - 64 - 44) / 6;
        const y = rect.height - 64 - (currentLevel + 0.5) * spacing;
        const data = context.getImageData(
          Math.round((rect.width / 2 - 30) * scaleX),
          Math.round((y - 5) * scaleY),
          Math.max(1, Math.round(60 * scaleX)),
          Math.max(1, Math.round(10 * scaleY)),
        ).data;
        let bright = 0;
        let samples = 0;
        for (let pixel = 0; pixel < data.length; pixel += 4) {
          const x = (pixel / 4) % Math.max(1, Math.round(60 * scaleX));
          if (Math.abs(x - 30 * scaleX) < 4 * scaleX) continue;
          samples += 1;
          if (data[pixel] > 30 || data[pixel + 1] > 48) bright += 1;
        }
        return bright / Math.max(samples, 1);
      }, level);
      if (brightRatio < 0.018) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await advance(page, 280);
        foundGap = true;
        break;
      }
      await advance(page, 12);
    }
    assert.ok(foundGap, `sweep level ${level + 1} never exposed a rendered center gap`);
  }
  await waitSolved(page, root, "sweep", 1500);
}

function lcg(seed, divisor = 4294967296) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / divisor;
  };
}

function initialUnknotPoints() {
  const random = lcg(10366785);
  let fallback = null;
  const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1]];
  const intersect = (a, b, c, d) => {
    const denominator = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
    if (Math.abs(denominator) < 1e-9) return false;
    const first = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / denominator;
    const second = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / denominator;
    return first > 0.001 && first < 0.999 && second > 0.001 && second < 0.999;
  };
  const crossingCount = (points) => {
    let count = 0;
    for (let first = 0; first < edges.length; first += 1) for (let second = first + 1; second < edges.length; second += 1) {
      const [a, b] = edges[first], [c, d] = edges[second];
      if (a === c || a === d || b === c || b === d) continue;
      if (intersect(points[a], points[b], points[c], points[d])) count += 1;
    }
    return count;
  };
  const clearOfEdges = (points) => {
    const distance = (point, a, b) => {
      const dx = b.x - a.x, dy = b.y - a.y;
      const ratio = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / Math.max(dx * dx + dy * dy, 1e-9)));
      return Math.hypot(point.x - (a.x + ratio * dx), point.y - (a.y + ratio * dy));
    };
    for (let point = 0; point < 7; point += 1) for (const [a, b] of edges)
      if (a !== point && b !== point && distance(points[point], points[a], points[b]) < 0.055) return false;
    return true;
  };
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const points = [];
    for (let guard = 0; points.length < 7 && guard < 400; guard += 1) {
      const candidate = { x: 0.08 + random() * 0.84, y: 0.08 + random() * 0.84 };
      if (points.every((point) => Math.hypot(candidate.x - point.x, candidate.y - point.y) >= 0.17)) points.push(candidate);
    }
    if (points.length < 7 || !clearOfEdges(points)) continue;
    const count = crossingCount(points);
    if (count >= 6 && count <= 9) return points;
    if (count >= 4 && count <= 12 && (!fallback || Math.abs(count - 8) < Math.abs(fallback.count - 8))) fallback = { points, count };
  }
  assert.ok(fallback, "failed to reproduce deterministic unknot board");
  return fallback.points;
}

async function solveUnknot(page, root) {
  const { box } = await canvasBox(root);
  const initial = initialUnknotPoints();
  const target = [{ x: 0.5, y: 0.5 }];
  for (let index = 0; index < 6; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / 6;
    target.push({ x: 0.5 + 0.38 * Math.cos(angle), y: 0.5 + 0.38 * Math.sin(angle) });
  }
  const point = (normalized) => ({ x: box.x + 30 + normalized.x * (box.width - 60), y: box.y + 30 + normalized.y * (box.height - 60) });
  for (let index = 0; index < initial.length; index += 1) {
    const from = point(initial[index]), to = point(target[index]);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    await advance(page, 250);
    await page.mouse.up();
    await advance(page, 60);
  }
  await waitSolved(page, root, "unknot", 1800);
}

const DIRECTIONS = ["N", "E", "S", "W"];
const PATH_DIRECTIONS = new Map([
  ["M30 0V60", ["N", "S"]], ["M0 30H60", ["W", "E"]],
  ["M30 0A30 30 0 0 0 60 30", ["N", "E"]], ["M60 30A30 30 0 0 0 30 60", ["E", "S"]],
  ["M30 60A30 30 0 0 0 0 30", ["S", "W"]], ["M0 30A30 30 0 0 0 30 0", ["W", "N"]],
  ["M30 30H60", ["E"]], ["M0 30H30", ["W"]], ["M30 0V30", ["N"]], ["M30 30V60", ["S"]],
]);
const opposite = (direction) => DIRECTIONS[(DIRECTIONS.indexOf(direction) + 2) % 4];
const rotateDirection = (direction, turns) => DIRECTIONS[(DIRECTIONS.indexOf(direction) + turns) % 4];

async function solveRelay(page, root) {
  const board = await root.evaluate((element) => {
    const buttons = [...element.querySelectorAll("button[data-tile]")];
    const tiles = Array.from({ length: 25 }, (_, index) => ({ index, blocked: true, paths: [], turns: 0 }));
    for (const button of buttons) {
      const index = Number(button.dataset.tile);
      const svg = button.querySelector("svg");
      tiles[index] = { index, blocked: false, paths: [...new Set([...svg.querySelectorAll("path")].map((path) => path.getAttribute("d")))], turns: Number.parseInt(svg.style.transform.match(/-?\d+/)?.[0] ?? "0", 10) / 90 };
    }
    const divs = [...element.querySelectorAll("div")];
    const inlet = divs.find((node) => node.style.left === "-18px");
    const outlet = divs.find((node) => node.style.right === "-20px");
    return { tiles, inletRow: Math.round((Number.parseFloat(inlet.style.top) - 27) / 64), outletRow: Math.round((Number.parseFloat(outlet.style.top) - 24) / 64) };
  });
  const tiles = board.tiles.map((tile) => {
    const base = new Set();
    for (const path of tile.paths) for (const direction of PATH_DIRECTIONS.get(path) ?? []) base.add(direction);
    return { ...tile, base };
  });
  const compatible = (tile, incoming, outgoing) => {
    if (tile.blocked) return false;
    for (let turns = 0; turns < 4; turns += 1) {
      const rotated = new Set([...tile.base].map((direction) => rotateDirection(direction, turns)));
      if (rotated.has(incoming) && rotated.has(outgoing)) return true;
    }
    return false;
  };
  let solution = null;
  const visit = (index, incoming, visited, path) => {
    if (solution) return;
    const row = Math.floor(index / 5), column = index % 5;
    const outgoingOptions = [...DIRECTIONS];
    if (row === board.outletRow && column === 4) outgoingOptions.unshift("E");
    for (const outgoing of outgoingOptions) {
      if (!compatible(tiles[index], incoming, outgoing)) continue;
      if (row === board.outletRow && column === 4 && outgoing === "E") { solution = [...path, { index, incoming, outgoing }]; return; }
      const delta = { N: -5, E: 1, S: 5, W: -1 }[outgoing];
      const next = index + delta;
      if (next < 0 || next >= 25 || (outgoing === "E" && column === 4) || (outgoing === "W" && column === 0) || visited.has(next)) continue;
      const nextVisited = new Set(visited); nextVisited.add(next);
      visit(next, opposite(outgoing), nextVisited, [...path, { index, incoming, outgoing }]);
    }
  };
  const start = board.inletRow * 5;
  visit(start, "W", new Set([start]), []);
  assert.ok(solution, "relay board has no orientable inlet-to-outlet path");
  for (const step of solution) {
    const tile = tiles[step.index];
    let desiredTurns = -1;
    for (let turns = 0; turns < 4; turns += 1) {
      const rotated = new Set([...tile.base].map((direction) => rotateDirection(direction, turns)));
      if (rotated.has(step.incoming) && rotated.has(step.outgoing)) { desiredTurns = turns; break; }
    }
    const clicks = ((desiredTurns - tile.turns) % 4 + 4) % 4;
    for (let click = 0; click < clicks; click += 1) {
      await root.locator(`button[data-tile="${step.index}"]`).click();
      await advance(page, 20);
    }
  }
  await waitSolved(page, root, "relay", 2200);
}

async function solveEcho(page, root) {
  const { canvas, box } = await canvasBox(root);
  const lengths = [3, 4, 5];
  for (let stage = 0; stage < 3; stage += 1) {
    const centerX = box.x + box.width / 2, centerY = box.y + box.height * 0.52;
    const radius = Math.min(box.width, box.height) * 0.32;
    const sequence = [];
    const lit = Array(6).fill(false);
    let initialized = false;
    let quiet = 0;
    for (let elapsed = 0; elapsed < 18000 && sequence.length < lengths[stage]; elapsed += 25) {
      const warm = await canvas.evaluate((element) => {
        const context = element.getContext("2d"), rect = element.getBoundingClientRect();
        const sx = element.width / rect.width, sy = element.height / rect.height;
        const cx = rect.width / 2, cy = rect.height * 0.52, radius = Math.min(rect.width, rect.height) * 0.32;
        return Array.from({ length: 6 }, (_, pad) => {
          const angle = -Math.PI / 2 + (pad * Math.PI * 2) / 6;
          const data = context.getImageData(Math.round((cx + Math.cos(angle) * radius - 3) * sx), Math.round((cy + Math.sin(angle) * radius - 3) * sy), Math.max(1, Math.round(6 * sx)), Math.max(1, Math.round(6 * sy))).data;
          let warmPixels = 0;
          for (let pixel = 0; pixel < data.length; pixel += 4)
            if (data[pixel] > 105 && data[pixel + 1] > 85 && data[pixel + 2] > 65) warmPixels += 1;
          return warmPixels > 0;
        });
      });
      if (!initialized) {
        for (let pad = 0; pad < warm.length; pad += 1) lit[pad] = warm[pad];
        initialized = true;
        await advance(page, 25);
        continue;
      }
      let sawPulse = false;
      for (let pad = 0; pad < warm.length; pad += 1) {
        if (warm[pad] && !lit[pad]) { sequence.push(pad); sawPulse = true; }
        lit[pad] = warm[pad];
      }
      if (sawPulse) quiet = 0;
      else quiet += 25;
      if (quiet > 1600 && sequence.length < lengths[stage]) { sequence.length = 0; quiet = 0; }
      await advance(page, 25);
    }
    assert.equal(sequence.length, lengths[stage], `echo stage ${stage + 1} rendered pulse sequence was not observed`);
    await advance(page, 520);
    for (const pad of sequence) {
      const angle = -Math.PI / 2 + (pad * Math.PI * 2) / 6;
      await page.mouse.click(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      await advance(page, 35);
    }
    if (stage < 2) await advance(page, 920);
  }
  await waitSolved(page, root, "echo", 1800);
}

function normalizedPoint(box, x, y) {
  const radius = Math.min(box.width, box.height) / 2;
  return { x: box.x + box.width / 2 + x * radius, y: box.y + box.height / 2 + y * radius };
}

async function solveCurrent(page, root) {
  const { box } = await canvasBox(root);
  currentWaveObservedAt = await page.evaluate(() => performance.now());
  const holds = [
    { x: 0.52, y: -0.3, ms: 4500 }, { x: -0.06, y: 0.6, ms: 4500 }, { x: 0.3, y: -0.66, ms: 5000 },
    { x: -0.37, y: 0.42, ms: 24000 }, { x: 0.61, y: -0.3, ms: 19500 },
  ];
  const first = normalizedPoint(box, holds[0].x, holds[0].y);
  await page.mouse.move(first.x, first.y); await page.mouse.down();
  for (const hold of holds) {
    const point = normalizedPoint(box, hold.x, hold.y);
    await page.mouse.move(point.x, point.y, { steps: 10 });
    await advance(page, hold.ms);
  }
  await page.mouse.up();
  await waitSolved(page, root, "current", 1500);
}

async function solveLure(page, root) {
  const field = root.locator('div[data-game="lure"]').last();
  const box = await field.boundingBox();
  assert.ok(box && box.width > 0 && box.height > 0, "lure field has no layout box");
  const waypoints = [[-0.08, 0.297], [0.204, 0.297], [0.204, 0.099], [0.452, 0.099], [0.452, 0.485], [0.06, 0.485], [0.06, 0.718], [0.608, 0.718], [0.608, 0.277], [0.948, 0.277], [0.948, 0.515], [0.768, 0.515], [0.768, 0.683], [0.928, 0.683], [0.928, 0.817], [0.708, 0.817], [0.708, 0.946], [1, 0.946]];
  const map = ([x, y]) => ({ x: box.x + 26 + x * (box.width - 56), y: box.y + y * box.height });
  let previous = map(waypoints[0]);
  await page.mouse.move(Math.max(box.x + 10, previous.x), previous.y);
  await page.mouse.down();
  for (const waypoint of waypoints.slice(1)) {
    const next = map(waypoint);
    const steps = Math.max(2, Math.ceil(Math.hypot(next.x - previous.x, next.y - previous.y) / 6));
    for (let step = 1; step <= steps; step += 1) {
      await page.mouse.move(previous.x + ((next.x - previous.x) * step) / steps, previous.y + ((next.y - previous.y) * step) / steps);
      await advance(page, 95);
    }
    previous = next;
  }
  await advance(page, 1800);
  await page.mouse.up();
  await waitSolved(page, root, "lure", 1500);
}

const wrapAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
async function solveRipple(page, root) {
  const { box } = await canvasBox(root);
  assert.ok(currentWaveObservedAt !== null, "ripple solver requires current to establish the shared wave clock");
  const radii = [0.26, 0.42, 0.58, 0.74, 0.9].map((fraction) => fraction * (Math.min(box.width, box.height) / 2 - 6));
  const phases = [0.6, 2.75, -1.9, 1.35, -2.5], speeds = [0.014, -0.048, 0.08, -0.115, 0.185];
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  for (let ring = 1; ring < radii.length; ring += 1) {
    const now = await page.evaluate(() => performance.now());
    const elapsed = (now - currentWaveObservedAt) / 1000;
    const delta = wrapAngle((phases[0] + speeds[0] * elapsed) - (phases[ring] + speeds[ring] * elapsed));
    const radius = radii[ring];
    await page.mouse.move(center.x + radius, center.y); await page.mouse.down();
    const steps = Math.max(4, Math.ceil(Math.abs(delta) / 0.12));
    for (let step = 1; step <= steps; step += 1) {
      const angle = (delta * step) / steps;
      await page.mouse.move(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius);
    }
    await page.mouse.up(); await advance(page, 25);
  }
  await advance(page, 1150);
  await waitSolved(page, root, "ripple", 1600);
}

const balanceWeights = [2, 3, 5, 6];
const balanceHooks = [{ bar: 1, x: -0.75 }, { bar: 1, x: -0.3 }, { bar: 1, x: 0.5 }, { bar: 2, x: -0.25 }, { bar: 2, x: 0.4 }, { bar: 2, x: 0.75 }];
function balanceTilt(assignment) {
  let leftMoment = 0, rightMoment = 0, leftWeight = 0, rightWeight = 0;
  for (let index = 0; index < assignment.length; index += 1) {
    const hook = balanceHooks[assignment[index]];
    if (hook.bar === 1) { leftMoment += balanceWeights[index] * hook.x; leftWeight += balanceWeights[index]; }
    else { rightMoment += balanceWeights[index] * hook.x; rightWeight += balanceWeights[index]; }
  }
  const raw = [rightWeight - leftWeight, leftMoment, rightMoment], scales = [5, 2, 2], tolerances = [0.5, 0.12, 0.12];
  return raw.map((value, index) => {
    let degrees = 20 * Math.tanh(value / scales[index]);
    if (Math.abs(value) > tolerances[index]) degrees = Math.sign(value) * Math.max(Math.abs(degrees), 5);
    return degrees * Math.PI / 180;
  });
}

function balanceGeometry(box, assignment) {
  const scale = Math.min((box.width / 2 - 38) / 1.78, box.height / 3.4), centerX = box.width / 2;
  const top = box.height * 0.09, level = 0.55 * scale, drop = 0.95 * scale, weightDrop = 0.42 * scale;
  const angle = balanceTilt(assignment), pivot = { x: centerX, y: top + level };
  const left = { x: pivot.x - scale * Math.cos(angle[0]), y: pivot.y - scale * Math.sin(angle[0]) };
  const right = { x: pivot.x + scale * Math.cos(angle[0]), y: pivot.y + scale * Math.sin(angle[0]) };
  const bars = [{ x: left.x, y: left.y + drop }, { x: right.x, y: right.y + drop }];
  const hooks = balanceHooks.map((hook) => ({ x: bars[hook.bar - 1].x + hook.x * scale * Math.cos(angle[hook.bar]), y: bars[hook.bar - 1].y + hook.x * scale * Math.sin(angle[hook.bar]) }));
  const weights = assignment.map((hook, index) => ({ x: hooks[hook].x, y: hooks[hook].y + weightDrop + 0.092 * scale * Math.sqrt(balanceWeights[index]) }));
  return { hooks, weights };
}

async function solveBalance(page, root) {
  const { box } = await canvasBox(root);
  const assignment = [0, 4, 2, 1];
  for (const [weight, target] of [[0, 5], [3, 3], [2, 1], [1, 2]]) {
    const geometry = balanceGeometry(box, assignment), from = geometry.weights[weight], to = geometry.hooks[target];
    await page.mouse.move(box.x + from.x, box.y + from.y); await page.mouse.down();
    await page.mouse.move(box.x + to.x, box.y + to.y, { steps: 8 }); await page.mouse.up();
    assignment[weight] = target;
    await advance(page, 650);
  }
  await waitSolved(page, root, "balance", 2200);
}

export async function solveDataseaGame(page, id) {
  if (!HANDLED.has(id)) return false;
  const root = await rootFor(page, id);
  const solvers = { sweep: solveSweep, unknot: solveUnknot, relay: solveRelay, echo: solveEcho, current: solveCurrent, lure: solveLure, ripple: solveRipple, balance: solveBalance };
  await solvers[id](page, root);
  assert.ok(
    (!(await root.count()) && (await page.locator(".datasea-wave-break").count()) > 0) ||
      (await root.getAttribute("data-solved")) === "true",
    `${id} interaction solver did not complete gameplay`,
  );
  return true;
}
