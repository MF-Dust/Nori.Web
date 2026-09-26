import assert from "node:assert/strict";

// Read-only observation of the original model lets the browser choose inputs.
// This never calls a solve/progress callback or changes a hook/ref value.
async function inspectGame(page, id, kind) {
  return page
    .locator(`.datasea-game[data-game="${id}"]`)
    .evaluate((host, mode) => {
      const key = Object.keys(host).find((name) =>
        name.startsWith("__reactFiber$"),
      );
      const stack = key ? [host[key]] : [];
      while (stack.length) {
        const fiber = stack.pop();
        if (fiber?.memoizedProps?.api && typeof fiber.type === "function") {
          const states = [];
          for (let hook = fiber.memoizedState; hook; hook = hook.next)
            states.push(hook.memoizedState);
          if (mode === "discern") {
            const options = states
              .map((value) => value?.current)
              .find(
                (value) =>
                  Array.isArray(value) &&
                  value.some((entry) => typeof entry?.real === "boolean"),
              );
            return options?.findIndex((entry) => entry.real) ?? -1;
          }
          if (mode === "resonance") {
            const refs = states.filter(
              (value) => value && Object.hasOwn(value, "current"),
            );
            const target = refs.find((value) => value.current?.tF)?.current;
            return {
              values: refs.slice(1, 4).map((value) => value.current),
              target,
            };
          }
        }
        if (fiber?.child) stack.push(fiber.child);
        if (fiber?.sibling) stack.push(fiber.sibling);
      }
      return null;
    }, kind);
}

export async function solveDataseaCoreGame(page, id) {
  if (!["denoise", "steady", "discern", "resonance"].includes(id)) return false;
  const game = page.locator(`.datasea-game[data-game="${id}"]`);
  const chrome = game.locator("..").locator(".datasea-wave-titlebar");
  if (await chrome.count()) {
    await game
      .locator("..")
      .dispatchEvent("pointerdown", { pointerId: 1, clientX: 1, clientY: 1 });
    await page.clock.runFor(16);
  }
  const solved = async () =>
    (await game.getAttribute("data-solved")) === "true";
  if (id === "denoise") {
    const canvas = game.locator("canvas"),
      box = await canvas.boundingBox();
    assert.ok(
      box && box.width > 100 && box.height > 100,
      "denoise has a usable canvas",
    );
    // The brush radius is 13.5. One in-page sweep posts the pointer events the
    // canvas already listens for, instead of a Playwright mouse step per pixel.
    await canvas.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const fire = (type, x, y, buttons) => {
        element.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX: rect.left + x,
            clientY: rect.top + y,
            pointerId: 1,
            pointerType: "mouse",
            isPrimary: true,
            button: 0,
            buttons,
          }),
        );
      };
      fire("pointerdown", 2, 2, 1);
      const step = 10;
      for (let y = 2, row = 0; y < rect.height; y += step, row++) {
        const from = row % 2 ? rect.width - 2 : 2;
        const to = row % 2 ? 2 : rect.width - 2;
        const count = Math.max(2, Math.ceil(Math.abs(to - from) / step));
        for (let i = 0; i <= count; i++)
          fire("pointermove", from + ((to - from) * i) / count, y, 1);
      }
      fire("pointerup", 2, 2, 0);
    });
    await page.clock.runFor(80);
    if (!(await solved())) {
      await page.mouse.move(box.x + 2, box.y + 2);
      await page.mouse.down();
      for (let pass = 0; pass < 6 && !(await solved()); pass++) {
        for (let y = 2, row = 0; y < box.height; y += 22, row++) {
          await page.mouse.move(box.x + (row % 2 ? box.width - 2 : 2), box.y + y);
          await page.mouse.move(
            box.x + (row % 2 ? 2 : box.width - 2),
            box.y + y,
            { steps: 4 },
          );
          await page.clock.runFor(16);
        }
        await page.clock.runFor(80);
      }
      await page.mouse.up();
    }
    await page.clock.runFor(1600);
  } else if (id === "steady") {
    for (let frame = 0; frame < 2500 && !(await solved()); frame++) {
      const inBand = await game.evaluate((host) => {
        const band = host.querySelector("div[style*='border-left']");
        const cursor = [...host.querySelectorAll("div")].find(
          (node) => node.style.width === "" && node.classList.contains("w-px"),
        );
        if (!band || !cursor || band.style.opacity === "0") return false;
        return (
          Math.abs(
            parseFloat(cursor.style.left) -
              parseFloat(band.style.left) -
              parseFloat(band.style.width) / 2,
          ) < 1.2
        );
      });
      if (inBand) await game.click({ position: { x: 40, y: 40 }, force: true });
      await page.clock.runFor(16);
    }
  } else if (id === "discern") {
    for (let round = 0; round < 3; round++) {
      const index = await inspectGame(page, id, "discern");
      assert.ok(index >= 0, "discern round has an original real signal");
      await game.locator(".discern-wrap").nth(index).click({ force: true });
      await page.clock.runFor(2300);
    }
  } else {
    const labels = ["频率", "相位", "增益"];
    for (let iteration = 0; iteration < 32 && !(await solved()); iteration++) {
      for (let index = 0; index < 3; index++) {
        let data = await inspectGame(page, id, "resonance");
        assert.ok(data?.target, "resonance exposes its original target model");
        // Pointer focus chooses the actual dial; keyboard events use its shipped
        // precision adjustment, rather than writing the numeric state directly.
        const control = game
          .getByText(labels[index], { exact: true })
          .locator("..")
          .locator("div")
          .first();
        await control.click({ force: true });
        data = await inspectGame(page, id, "resonance");
        const delta =
          [data.target.r, data.target.phi, data.target.g][index] -
          data.values[index];
        const step = (index === 1 ? 0.05 : 0.03) * 0.3;
        const count = Math.round(Math.abs(delta) / step);
        await page.evaluate(
          ({ count, positive }) => {
            for (let i = 0; i < count; i++)
              window.dispatchEvent(
                new KeyboardEvent("keydown", {
                  key: positive ? "ArrowRight" : "ArrowLeft",
                  shiftKey: true,
                  bubbles: true,
                }),
              );
          },
          { count, positive: delta > 0 },
        );
      }
      await page.clock.runFor(150);
    }
    await page.clock.runFor(3200);
  }
  assert.equal(
    await solved(),
    true,
    `${id} must solve through its original input handlers`,
  );
  console.log(`Datasea ${id}: real input solve passed`);
  return true;
}
