import { expect, test } from "bun:test";
import { ChatReader, kindOf } from "./chat-reader.js";

test("a terminal runs pi when its report or its program says so", () => {
  expect(kindOf({ status: { app: "pi" } })).toBe("pi");
  expect(kindOf({ foreground: { name: "pi" } })).toBe("pi");
  expect(kindOf({ foreground: { name: "claude" } })).toBe("claude");
  expect(kindOf({ foreground: { name: "bash" } })).toBe(null);
  // npm's pi runs under node: herdr names its foreground "node"
  expect(kindOf({ foreground: { name: "node", argv: ["node", "/opt/homebrew/bin/pi", "--model", "quotio/x"] } })).toBe("pi");
  expect(kindOf({ foreground: { name: "node", argv: ["node", "/srv/app/server.js"] } })).toBe(null);
});

const live = (more = {}) => ({ state: "live", status: { app: "pi" }, foreground: { name: "pi", pid: 42 }, turn: 0, ...more });
const readerOf = (found) => { const calls = []; return { calls, r: new ChatReader({ sh: async (_s, args) => { calls.push(args); return { code: 0, stdout: found }; } }, "t1") }; };

test("a pi with its session file is followed from it, found by pi's kind and pid", async () => {
  const { r, calls } = readerOf("/h/.pi/agent/sessions/--w--/a_b.jsonl\n");
  expect(await r.locate(live())).toBe(true);
  expect(calls).toEqual([["chat", "pi", "42"]]);
  expect(r).toMatchObject({ kind: "pi", path: "/h/.pi/agent/sessions/--w--/a_b.jsonl" });
});

test("a pi with no session file before its first message is an empty chat, not a lost one", async () => {
  const { r } = readerOf("");
  await r.locate(live());
  expect(r.state).toBe("pending");
  expect(r.conv.kind).toBe("pi");
});

test("an ended pi's last log is read as it is", async () => {
  const { r } = readerOf("");
  const ended = { state: "finished", labels: { "herdr.resume": JSON.stringify({ kind: "pi", log: "/h/.pi/agent/sessions/--w--/a_b.jsonl" }) } };
  expect(await r.locate(ended)).toBe(true);
  expect(r).toMatchObject({ kind: "pi", pinned: true });
});
