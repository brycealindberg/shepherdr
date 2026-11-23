import { expect, spyOn, test } from "bun:test";
import { Agents } from "./agents.ts";

test("a stopped assistant can restart from its recorded session", async () => {
  const record = { address: "t1", state: "finished", argv: ["codex"], cwd: "/tmp", labels: { "herdr.role": "coordinator" } };
  const hub: any = { terminals: new Map([["t1", record]]) };
  const spawn = spyOn(Bun, "spawn").mockImplementation(((argv: any) => {
    expect(argv[0]).toBe("bash");
    return { stdout: new Blob(["t2\n"]).stream(), stderr: new Blob([]).stream(), exited: Promise.resolve(0) } as any;
  }) as any);
  try {
    expect(await new Agents(hub).restart("t1", { kind: "codex", path: null }, { kind: "codex" })).toBe("t2");
  } finally { spawn.mockRestore(); }
});

test("a stopped pi agent restarts on its own session, keeping its model", async () => {
  const uuid = "0198aaaa-bbbb-7ccc-8ddd-eeeeffff0000";
  const record = { address: "t1", state: "finished", argv: ["pi"], cwd: "/tmp", labels: {} };
  const hub: any = { terminals: new Map([["t1", record]]) };
  let seen: any = null;
  const spawn = spyOn(Bun, "spawn").mockImplementation(((argv: any) => {
    seen = JSON.parse(argv[3]);
    return { stdout: new Blob(["t2\n"]).stream(), stderr: new Blob([]).stream(), exited: Promise.resolve(0) } as any;
  }) as any);
  try {
    const argv = ["pi", "-ne", "-ns", "-nc", "-e", "~/x/quotio.ts", "--model", "quotio/gemini-3-pro:high"];
    await new Agents(hub).restart("t1", { kind: "pi", path: `/h/.pi/agent/sessions/--tmp--/2026-01-01T00-00-00-000Z_${uuid}.jsonl`, argv }, { kind: "pi", model: "quotio:gemini-3-pro", effort: "high" });
  } finally { spawn.mockRestore(); }
  expect(seen[0]).toBe("pi");
  expect(seen.slice(seen.indexOf("--session"))).toEqual(["--session", uuid]);
  expect(seen).toContain("quotio/gemini-3-pro:high");
});
