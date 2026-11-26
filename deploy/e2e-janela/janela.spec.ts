import { type Page, expect, test } from "@playwright/test";

// Read-only: navigates the public booking pages, never books.
// SLUG=ss27 (default) checks the South Summit cafe on 14/04/2027 at 15:00/15:45/16:30.
// Any other SLUG picks its target from the API: the first day with slots in the
// last two weeks of the booking window (i.e. unreachable before this change).
const USER = "josevitor";
const SLUG = process.env.SLUG ?? "ss27";
const ZONE = "America/Sao_Paulo";
const DAY = 86_400_000;
const PAGES = [`/${USER}/${SLUG}`, `/embed/${USER}/${SLUG}`, ...(process.env.SHORT ? [`/${process.env.SHORT}`] : [])];

type Target = { date: string; times: string[]; bookableUntil: string; id: string };
let target: Target;

const ymd = (ms: number) => new Intl.DateTimeFormat("en-CA", { timeZone: ZONE }).format(ms);
const hm = (ms: number) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, hour: "2-digit", minute: "2-digit" }).format(ms);
const midnightUtc = (date: string) => `${date}T03:00:00.000Z`; // Sao Paulo has no DST

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  const res = page.waitForResponse((r) => r.url().includes("/api/availability/"));
  await page.goto(`/${USER}/${SLUG}`);
  const first = await res;
  const body = await first.json();
  const id = new URL(first.url()).pathname.split("/").pop() as string;
  const until = Date.parse(body.bookableUntil ?? "2027-12-31T00:00:00Z");
  const api = async (from: string, to: string) =>
    (await (await page.request.get(`/api/availability/${id}?from=${from}&to=${to}`)).json()).slots as {
      start: string;
    }[];
  if (SLUG === "ss27") {
    target = { date: "2027-04-14", times: ["15:00", "15:45", "16:30"], bookableUntil: body.bookableUntil, id };
  } else {
    const slots = await api(new Date(until - 14 * DAY).toISOString(), new Date(until).toISOString());
    expect(slots.length, "no slots in the last two weeks of the window").toBeGreaterThan(0);
    const date = ymd(Date.parse(slots[0].start));
    const times = slots.filter((s) => ymd(Date.parse(s.start)) === date).slice(0, 3).map((s) => hm(Date.parse(s.start)));
    target = { date, times, bookableUntil: body.bookableUntil, id };
  }
  await page.close();
});

/** "abr. 14"-style chip label for the target day. */
function chipName() {
  const [y, m, d] = target.date.split("-").map(Number);
  const mon = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" })
    .format(Date.UTC(y, m - 1, d, 12))
    .replace(".", "");
  // Day chip ("abr. 14 3 horários"), not the "abr. 14 · 3:00 PM" quick-pick that books.
  return new RegExp(`${mon}\\.? ${d} \\d`, "i");
}

async function openTargetDay(page: Page) {
  const chip = page.getByRole("button", { name: chipName() }).first();
  await expect(chip).toBeVisible({ timeout: 30_000 });
  await chip.click();
  for (const time of target.times) {
    const [h, mi] = time.split(":").map(Number);
    const h12 = ((h + 11) % 12) + 1;
    const re = new RegExp(`^(${time}|${h12}:${String(mi).padStart(2, "0")}\\s?${h < 12 ? "AM" : "PM"})$`, "i");
    await expect(page.getByRole("button", { name: re })).toBeVisible();
  }
}

for (const path of PAGES) {
  test(`${path}: date input reaches ${SLUG === "ss27" ? "14/04/2027" : "the end of the window"}`, async ({ page }) => {
    await page.goto(path);
    const date = page.getByLabel("Ir para a data");
    await expect(date).toBeVisible({ timeout: 30_000 });
    const max = await date.getAttribute("max");
    expect(max && max >= target.date).toBeTruthy();
    await date.fill(target.date);
    await openTargetDay(page);
    await expect(page.getByRole("button", { name: "Semanas anteriores" })).toHaveAttribute("aria-disabled", "false");
    await page.screenshot({
      path: `/out/janela-${SLUG}-${test.info().project.name}-${path.replace(/\W+/g, "_")}.png`,
      fullPage: true,
    });
  });
}

test("typing the date on the keyboard keeps the field and lands on the day", async ({ page }) => {
  await page.goto(PAGES[0]);
  const date = page.getByLabel("Ir para a data");
  await expect(date).toBeVisible({ timeout: 30_000 });
  const [y, m, d] = target.date.split("-");
  await date.focus(); // first segment (day); a centre click would land on the month/year segment
  // shortcut: headless Chromium on Linux renders date segments as mm/dd/yyyy whatever the
  // locale/--lang/LANG; switch to `${d}${m}${y}` when running headed on a pt-BR desktop.
  await page.keyboard.type(`${m}${d}${y}`, { delay: 80 });
  await expect(date).toHaveValue(target.date);
  await openTargetDay(page);
});

test("'Próximas semanas' keeps focus, pages to the day and back", async ({ page }) => {
  await page.goto(PAGES[0]);
  const next = page.getByRole("button", { name: /Próximas semanas/ });
  const prev = page.getByRole("button", { name: "Semanas anteriores" });
  await expect(next).toBeVisible({ timeout: 30_000 });
  await expect(prev).toHaveAttribute("aria-disabled", "true");
  const chip = page.getByRole("button", { name: chipName() }).first();
  for (let i = 0; i < 30 && !(await chip.isVisible()); i++) {
    await expect(next).toHaveAttribute("aria-disabled", "false", { timeout: 30_000 });
    await next.click();
    await expect(page.locator('output[aria-busy="true"]')).toHaveCount(0, { timeout: 30_000 });
    await expect(next).toBeFocused(); // nav stays mounted across loading states
  }
  await openTargetDay(page);
  await prev.click();
  await expect(chip).toHaveCount(0, { timeout: 30_000 });
  await expect(prev).toBeFocused();
});

test("a date typed past the window lands on the last bookable weeks", async ({ page }) => {
  await page.goto(PAGES[0]);
  const date = page.getByLabel("Ir para a data");
  await expect(date).toBeVisible({ timeout: 30_000 });
  await date.fill(ymd(Date.parse(target.bookableUntil) + 60 * DAY));
  await expect(page.getByRole("button", { name: /Próximas semanas/ })).toHaveAttribute("aria-disabled", "true", {
    timeout: 30_000,
  });
  // The field shows the day the grid opened on, not the unbookable day typed.
  await expect(date).toHaveValue(ymd(Date.parse(target.bookableUntil) - 14 * DAY));
  await expect(page.getByRole("button", { name: "Semanas anteriores" })).toHaveAttribute("aria-disabled", "false");
});

test("API reports bookableUntil and serves the target day", async ({ request }) => {
  expect(typeof target.bookableUntil).toBe("string");
  expect(target.bookableUntil >= `${target.date}T`).toBeTruthy();
  const next = ymd(Date.parse(midnightUtc(target.date)) + DAY);
  const res = await request.get(`/api/availability/${target.id}?from=${midnightUtc(target.date)}&to=${midnightUtc(next)}`);
  const times = (await res.json()).slots.map((s: { start: string }) => hm(Date.parse(s.start)));
  expect(times).toEqual(expect.arrayContaining(target.times));
});
