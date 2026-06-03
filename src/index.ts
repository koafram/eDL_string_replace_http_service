import cluster from "cluster";
import os from "os";
import { createServer } from "./server";

export const DEFAULT_PORT = Number(process.env.PORT) || 3000;
export const DEFAULT_MAX_REPLACEMENTS = Number(process.env.MAX_REPLACEMENTS) || 1000;
export const WORKER_COUNT = Number(process.env.WORKER_COUNT) || os.cpus().length;

export function parseMaxReplacements(value: string | null): number {
  if (!value) {
    return DEFAULT_MAX_REPLACEMENTS;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    throw new Error("maxReplacements must be a non-negative integer");
  }

  return parsed;
}

function startWorker() {
  const server = createServer();

  server.listen(DEFAULT_PORT, () => {
    console.log(`Worker ${process.pid} listening on port ${DEFAULT_PORT}`);
  });
}

function startMaster() {
  console.log(`Master ${process.pid} is starting ${WORKER_COUNT} workers`);
  for (let i = 0; i < WORKER_COUNT; i += 1) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.warn(`Worker ${worker.process.pid} died (code=${code}, signal=${signal}). Restarting...`);
    cluster.fork();
  });
}

if (cluster.isPrimary) {
  startMaster();
} else {
  startWorker();
}
