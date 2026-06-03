import cluster from "cluster";
import { createServer } from "./server";

import { DEFAULT_PORT, WORKER_COUNT } from "./config/config";

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
