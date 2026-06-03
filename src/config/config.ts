import os from "os";

export const DEFAULT_PORT = Number(process.env.PORT) || 3000;
export const DEFAULT_MAX_REPLACEMENTS = Number(process.env.MAX_REPLACEMENTS) || 1000;
export const WORKER_COUNT = Number(process.env.WORKER_COUNT) || os.cpus().length;
