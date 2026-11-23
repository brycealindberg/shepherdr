import { expect, test } from "bun:test";

const run = async (code: string) => {
  const p = Bun.spawn([process.execPath, "-e", `await import(${JSON.stringify(import.meta.dir + "/log.ts")}); ${code}`], { stdout: "pipe", stderr: "pipe" });
  const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
  await p.exited;
  return { out, err };
};
const ISO = "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z";

test("console.log and console.error lines start with an ISO time", async () => {
  const { out, err } = await run('console.log("Shepherdr up", 7788); console.error("chat t2: %s", "gone");');
  expect(out).toMatch(new RegExp(`^${ISO} Shepherdr up 7788\\n$`));
  expect(err).toMatch(new RegExp(`^${ISO} chat t2: gone\\n$`));
});

test("every line of a multi-line message is stamped", async () => {
  const { err } = await run('console.error(new Error("boom"));');
  const lines = err.trimEnd().split("\n");
  expect(lines.length).toBeGreaterThan(1);
  for (const l of lines) expect(l).toMatch(new RegExp(`^${ISO} `));
});
