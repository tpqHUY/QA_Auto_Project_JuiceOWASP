// Blocks until Juice Shop answers on its version endpoint (or times out).
// Used locally (`npm run app:wait`) and in CI after `docker compose up -d`.
import http from 'node:http';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const HEALTH_URL = `${BASE_URL}/rest/admin/application-version`;
const TIMEOUT_MS = Number(process.env.WAIT_TIMEOUT_MS ?? 120_000);
const INTERVAL_MS = 3_000;

function ping(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(4_000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

const start = Date.now();
process.stdout.write(`Waiting for Juice Shop at ${HEALTH_URL} ...\n`);

while (Date.now() - start < TIMEOUT_MS) {
  if (await ping(HEALTH_URL)) {
    process.stdout.write(`Juice Shop is up (after ${Math.round((Date.now() - start) / 1000)}s).\n`);
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, INTERVAL_MS));
}

process.stderr.write(`Timed out after ${TIMEOUT_MS / 1000}s waiting for Juice Shop.\n`);
process.exit(1);
