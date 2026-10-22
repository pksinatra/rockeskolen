import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
});
test("all modes play, stop on switching, and noise starts procedurally", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  expect(await page.locator("#masterVolume").inputValue()).toBe("30");
  for (const mode of ["tone", "multi", "sweep", "binaural", "noise"]) {
    await page.locator(`[data-tab="${mode}"]`).click();
    await page.locator(`#${mode}Play`).click();
    await expect(page.locator(`#${mode}Play`)).toHaveText("■ STOP");
    await expect(page.locator("#audioStatus")).toContainText(`Playing ${mode}`);
    await page.locator('[data-tab="presets"]').click();
    await expect(page.locator("#audioStatus")).toHaveText("Audio stopped");
  }
  expect(errors).toEqual([]);
});
test("decimal input, frequency cap and Multi updates preserve active oscillator nodes", async ({
  page,
}) => {
  await page.locator("#toneFreq").fill("440,5");
  await page.locator("#toneFreq").press("Tab");
  await expect(page.locator("#toneFreq")).toHaveValue("440.50");
  await page.locator("#toneFreq").fill("24000");
  await page.locator("#toneFreq").press("Tab");
  await expect(page.locator("#toneFreq")).toHaveValue("20000.00");
  await page.evaluate(() => {
    const proto = AudioContext.prototype,
      create = proto.createOscillator;
    (window as any).oscillators = [];
    proto.createOscillator = function () {
      const node = create.call(this);
      (window as any).oscillators.push(node);
      return node;
    };
  });
  await page.locator('[data-tab="multi"]').click();
  await page.locator("#multiPlay").click();
  await expect(page.locator("#multiPlay")).toHaveText("■ STOP");
  expect(await page.evaluate(() => (window as any).oscillators.length)).toBe(3);
  await page.locator(".osc-f").first().fill("550");
  await page.locator(".mute").first().click();
  await page.locator(".solo").nth(1).click();
  await expect(page.locator(".mute").first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(await page.evaluate(() => (window as any).oscillators.length)).toBe(3);
  await page.locator("#addOscBtn").click();
  await expect
    .poll(() => page.evaluate(() => (window as any).oscillators.length))
    .toBe(4);
  await page.locator(".osc-delete").last().click();
  await page.locator("#multiPlay").click();
  await expect(page.locator("#audioStatus")).toHaveText("Audio stopped");
});
test("full state reload and mobile preset save/delete are accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator("#savePresetBtn")).toBeVisible();
  await page.locator('[data-tab="binaural"]').click();
  await page.locator("#binauralCarrier").fill("350");
  await page.locator("#binauralBeat").fill("7.5");
  await page.locator("#binauralMode").selectOption("right");
  await page.reload();
  await expect(page.locator("#panel-binaural")).toHaveClass(/active/);
  await expect(page.locator("#binauralCarrier")).toHaveValue("350");
  await expect(page.locator("#binauralBeat")).toHaveValue("7.5");
  await expect(page.locator("#binauralMode")).toHaveValue("right");
  await expect(page.locator("#audioStatus")).toHaveText("Audio stopped");
  await page.locator("#savePresetBtn").click();
  await page.locator("#presetName").fill("My stereo <test>");
  await page.locator("#presetForm button[type=submit]").click();
  await page.locator('[data-tab="presets"]').click();
  await expect(page.locator("#customPresets")).toContainText(
    "My stereo <test>",
  );
  await page
    .getByRole("button", { name: "My stereo <test>", exact: true })
    .click();
  await expect(page.locator("#binauralBeat")).toHaveValue("7.5");
  await page.locator('[data-tab="presets"]').click();
  await page
    .getByRole("button", {
      name: "Delete preset My stereo <test>",
      exact: true,
    })
    .click();
  await expect(page.locator("#customPresetsWrap")).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("short sweep completes and switching cancels pending starts", async ({
  page,
}) => {
  await page.locator('[data-tab="sweep"]').click();
  await page.locator("#sweepDuration").fill("0.1");
  await page.locator("#sweepDuration").press("Tab");
  await page.locator("#sweepPlay").click();
  await expect(page.locator("#sweepPlay")).toHaveText("▶ START SWEEP");
  await page.locator('[data-tab="noise"]').click();
  await page.locator("#noisePlay").click();
  await page.locator('[data-tab="tone"]').click();
  await expect(page.locator("#audioStatus")).toHaveText("Audio stopped");
});
test("rendered audio stays bounded and binaural channels remain separated", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const { Graph } = await import("/src/audio/graph.ts");
    const { BinauralEngine } = await import("/src/audio/binaural.ts");
    const { MultiEngine } = await import("/src/audio/multi.ts");
    const render = async (kind: string) => {
      const ctx = new OfflineAudioContext(2, 48000, 48000);
      const graph = new Graph(ctx as any);
      graph.setMaster(1, 0);
      if (kind === "multi")
        new MultiEngine(
          graph,
          Array.from({ length: 8 }, (_, i) => ({
            id: String(i),
            f: 440,
            wave: "square",
            vol: 1,
            pan: 0,
            mute: false,
            solo: false,
          })),
        );
      else
        new BinauralEngine(graph, {
          carrier: 200,
          beat: 10,
          mode: "left",
          wave: "sine",
        });
      return ctx.startRendering();
    };
    const multi = await render("multi"),
      stereo = await render("stereo");
    const energy = (data: Float32Array, f: number) => {
      let a = 0,
        b = 0;
      for (let i = 24000; i < 48000; i++) {
        a += data[i] * Math.cos((2 * Math.PI * f * i) / 48000);
        b += data[i] * Math.sin((2 * Math.PI * f * i) / 48000);
      }
      return Math.hypot(a, b);
    };
    const left = stereo.getChannelData(0),
      right = stereo.getChannelData(1);
    return {
      peak: Math.max(...multi.getChannelData(0).map(Math.abs)),
      leftIsolation: energy(left, 200) / energy(left, 210),
      rightIsolation: energy(right, 210) / energy(right, 200),
    };
  });
  expect(result.peak).toBeGreaterThan(0.01);
  expect(result.peak).toBeLessThanOrEqual(0.951);
  expect(result.leftIsolation).toBeGreaterThan(100);
  expect(result.rightIsolation).toBeGreaterThan(100);
});

test("explicit zero is silent from the first sample, including startup fades", async ({
  page,
}) => {
  const peak = await page.evaluate(async () => {
    const { Graph } = await import("/src/audio/graph.ts");
    const { ToneEngine } = await import("/src/audio/tone.ts");
    const ctx = new OfflineAudioContext(2, 4800, 48000);
    const graph = new Graph(ctx as any, 0);
    graph.setMaster(0, 0);
    new ToneEngine(graph, { frequency: 440, wave: "sine" } as any);
    const data = await ctx.startRendering();
    return Math.max(...data.getChannelData(0).map(Math.abs));
  });
  expect(peak).toBe(0);
});
