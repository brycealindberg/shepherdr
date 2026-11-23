import { expect, test } from "bun:test";
import { counts, countClose, countOpen, timed } from "./stats.ts";

test("websocket opens and closes count, and only a close code other than 1000/1001 is abnormal", () => {
  const was = { ...counts };
  countOpen();
  countClose(1000);
  countClose(1001);
  countClose(1006);
  countClose(1011);
  expect(counts.wsOpens - was.wsOpens).toBe(1);
  expect(counts.wsCloses - was.wsCloses).toBe(4);
  expect(counts.wsAbnormal - was.wsAbnormal).toBe(2);
});

test("a request over 1000 ms is counted slow and logged once with its path; a quick one is not", async () => {
  const lines: string[] = [];
  const log = console.log;
  console.log = (...a: unknown[]) => { lines.push(a.join(" ")); };
  const was = { ...counts };
  try {
    await timed(new Request("http://x/api/slow?q=1"), async () => { await Bun.sleep(1050); return new Response("ok"); });
    await timed(new Request("http://x/api/fast"), async () => new Response("ok"));
  } finally { console.log = log; }
  expect(counts.slow - was.slow).toBe(1);
  expect(lines.length).toBe(1);
  expect(lines[0]).toMatch(/slow request GET \/api\/slow \d{4,} ms/);
});

test("a 5xx response counts, a 4xx does not, and a handler that throws counts and still throws", async () => {
  const was = { ...counts };
  await timed(new Request("http://x/a"), async () => new Response("no", { status: 502 }));
  await timed(new Request("http://x/a"), async () => new Response("no", { status: 404 }));
  expect(counts.http5xx - was.http5xx).toBe(1);
  await expect(timed(new Request("http://x/a"), async () => { throw new Error("boom"); })).rejects.toThrow("boom");
  expect(counts.http5xx - was.http5xx).toBe(2);
});
