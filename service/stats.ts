export const counts = { wsOpens: 0, wsCloses: 0, wsAbnormal: 0, slow: 0, http5xx: 0 };

export const countOpen = () => { counts.wsOpens++; };
export function countClose(code: number) {
  counts.wsCloses++;
  if (code !== 1000 && code !== 1001) counts.wsAbnormal++;
}

export async function timed(req: Request, run: () => Promise<Response | undefined> | Response | undefined) {
  const t0 = performance.now();
  try {
    const res = await run();
    if (res && res.status >= 500) counts.http5xx++;
    return res;
  } catch (e) {
    counts.http5xx++;
    throw e;
  } finally {
    const ms = Math.round(performance.now() - t0);
    if (ms > 1000) {
      counts.slow++;
      console.log(`slow request ${req.method} ${new URL(req.url).pathname} ${ms} ms`);
    }
  }
}
