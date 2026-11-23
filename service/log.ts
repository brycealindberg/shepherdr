import { format } from "node:util";

// launchd and systemd append the service's output to service.log across restarts: each line says when it was written
for (const name of ["log", "error", "warn"] as const) {
  console[name] = (...args: unknown[]) => {
    const at = new Date().toISOString();
    process[name === "log" ? "stdout" : "stderr"].write(`${at} ${format(...args).replace(/\n/g, `\n${at} `)}\n`);
  };
}
