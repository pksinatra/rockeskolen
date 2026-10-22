import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
});
test("original Tone, quick sessions, color and sequences stay usable", async ({
  page,
}) => {
  await expect(page.locator("#frequencyText")).toHaveText("432");
  await page.locator("#playButton").click();
  await expect(page.locator("#stateText")).toContainText("Audio playing");
  await page.locator("#frequencyNumber").fill("528");
  await page.locator("#frequencyNumber").dispatchEvent("input");
  await expect(page.locator("#frequencyText")).toHaveText("528");
  await page.locator("#warmthRange").fill("0.8");
  await page.locator("#stopButton").click();
  await expect(page.locator("#stateText")).toHaveText("Audio stopped");
  await page.locator(".quick-session").first().click();
  await expect(page.locator("#frequencyText")).toHaveText("396");
  await expect(page.locator("#stateText")).toContainText("Audio playing");
  await page.locator("#stopButton").click();
  await page.locator("#templateArpFast").click();
  await page.locator("#playSequence").click();
  await expect(page.locator("#stateText")).toContainText("Sequence");
  await page.locator("#stopButton").click();
});
test("eight Multi voices have live mute, solo, delete and no auth", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/subscriber|access.php/.test(r.url())) requests.push(r.url());
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
  await page.locator('[data-mode="multi"]').click();
  for (let i = 3; i < 8; i++) await page.locator("#addOscBtn").click();
  await expect(page.locator(".osc-card")).toHaveCount(8);
  await page.locator("#multiPlay").click();
  await expect(page.locator("#stateText")).toHaveText("Playing multi");
  await page.locator(".osc-f").first().fill("550");
  await page.locator(".mute").first().click();
  await page.locator(".solo").nth(1).click();
  await expect(page.locator(".solo").nth(1)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator(".remove").last().click();
  await expect(page.locator(".osc-card")).toHaveCount(7);
  await page.locator("#multiPlay").click();
  expect(requests).toEqual([]);
});
test("Sweep, Binaural and all Noise colors play and stop between modes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const mode of ["sweep", "binaural", "noise"]) {
    await page.locator(`[data-mode="${mode}"]`).click();
    await expect(page.locator("#stateText")).toHaveText("Audio stopped");
    if (mode === "sweep") {
      await page.locator("#sweepLoop").check();
      await page.locator("#sweepMotion").selectOption("pingpong");
    }
    if (mode === "binaural") {
      await page.locator("#binauralCarrier").fill("200");
      await page.locator("#binauralBeat").fill("10");
      await expect(page.locator("#leftFreq")).toHaveText("195.00 Hz");
      await expect(page.locator("#rightFreq")).toHaveText("205.00 Hz");
    }
    await page.locator("#" + mode + "Play").click();
    await expect(page.locator("#stateText")).toHaveText("Playing " + mode);
    if (mode === "noise")
      for (const kind of ["pink", "brown", "white"]) {
        await page.locator(`[data-noise="${kind}"]`).click();
        await expect(page.locator(`[data-noise="${kind}"]`)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      }
  }
  await page.locator('[data-mode="tone"]').click();
  await expect(page.locator("#stateText")).toHaveText("Audio stopped");
  expect(errors).toEqual([]);
});
test("full setups save load delete and share without losing Etherea tone settings", async ({
  page,
}) => {
  await page.locator("#frequencyNumber").fill("639");
  await page.locator("#frequencyNumber").dispatchEvent("input");
  await page.locator("#echoRange").fill("0.2");
  await page.locator('[data-mode="binaural"]').click();
  await page.locator("#binauralBeat").fill("7.5");
  await page.locator("#advancedVolume").fill("0");
  await page.locator("#fullSave").click();
  await page.locator("#setupName").fill("My complete setup");
  await page.locator("#setupForm button[type=submit]").click();
  await page.locator("#binauralBeat").fill("12");
  await page.locator('[data-mode="presets"]').click();
  await page
    .getByRole("button", { name: "My complete setup", exact: true })
    .click();
  await expect(page.locator("#panel-binaural")).toBeVisible();
  await expect(page.locator("#binauralBeat")).toHaveValue("7.5");
  await expect(page.locator("#advancedVolume")).toHaveValue("0");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw Error("fallback");
        },
      },
    }),
  );
  await page.locator("#fullShare").click();
  const url = await page.locator("#setupLink").inputValue();
  await page.goto(url);
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#panel-binaural")).toBeVisible();
  await expect(page.locator("#binauralBeat")).toHaveValue("7.5");
  await page.locator('[data-mode="tone"]').click();
  await expect(page.locator("#frequencyText")).toHaveText("639");
  await expect(page.locator("#echoRange")).toHaveValue("0.2");
  await page.locator('[data-mode="presets"]').click();
  await page
    .getByRole("button", {
      name: "Delete setup My complete setup",
      exact: true,
    })
    .click();
  await expect(page.locator("#generatorSaved")).toContainText(
    "No complete setups",
  );
});
test("short advanced timer stops audio and preserves output level", async ({
  page,
}) => {
  const setup = {
    generator: {
      mode: "noise",
      volume: 0.17,
      session: { seconds: 0.7, fade: 0.2 },
    },
    frequencer: { hz: 432 },
  };
  await page.goto("/?setup=" + encodeURIComponent(JSON.stringify(setup)));
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
  await page.locator("#noisePlay").click();
  await expect(page.locator("#stateText")).toHaveText("Playing noise");
  await expect(page.locator("#stateText")).toHaveText("Audio stopped", {
    timeout: 4000,
  });
  await expect(page.locator("#advancedVolume")).toHaveValue("17");
});
test("legacy frequency link and original custom presets still work", async ({
  page,
}) => {
  await page.goto("/?frequency=528");
  await expect(page.locator("#frequencyText")).toHaveText("528");
  await page.locator("#presetNameInput").fill("Original preset");
  await page.locator("#saveNamedPreset").click();
  await expect(page.locator("#saveStatus")).toContainText("1 saved");
});
for (const width of [1280, 1024, 375])
  test("Etherea layout and new modes fit " + width, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({
      path: "artifacts/" + info.project.name + "-tone-" + width + ".png",
      fullPage: true,
    });
    for (const mode of [
      "tone",
      "multi",
      "sweep",
      "binaural",
      "noise",
      "presets",
    ]) {
      await page.locator(`[data-mode="${mode}"]`).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.locator('[data-mode="multi"]').click();
    await page.screenshot({
      path: "artifacts/" + info.project.name + "-multi-" + width + ".png",
      fullPage: true,
    });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });
