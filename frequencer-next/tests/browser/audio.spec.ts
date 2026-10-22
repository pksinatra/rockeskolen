import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  test.skip(
    Boolean(process.env.FG_BUILD),
    "Offline source-module verification runs in development suite",
  );
  await page.goto("/");
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
