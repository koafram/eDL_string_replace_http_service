import http, { IncomingMessage, ServerResponse } from "http";
import cluster from "cluster";

import { URL } from "url";
import os from "os";

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

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

interface JsonObject {
  [key: string]: JsonValue;
}

export interface ReplacementResult {
  data: JsonValue;
  noOfReplacements: number;
  limitReached: boolean;
}

export function replaceDogWithCat(payload: JsonValue, maxReplacements: number): ReplacementResult {
  let noOfReplacements = 0;

  const traverseData = (value: JsonValue): JsonValue => {
    if (noOfReplacements >= maxReplacements) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(traverseData);
    }

    if (value && typeof value === "object") {
      return Object.entries(value).reduce<Record<string, JsonValue>>((acc, [key, item]) => {
        acc[key] = traverseData(item);

        return acc;
      }, {});
    }

    if (typeof value === "string") {
      if (value === "dog") {
        noOfReplacements += 1;

        return "cat";
      }

      return value;
    }

    return value;
  };

  return {
    data: traverseData(payload),
    noOfReplacements,
    limitReached: noOfReplacements >= maxReplacements,
  };
}

function buildJsonResponse(res: ServerResponse, statusCode: number, payload: JsonValue) {
  const body = JSON.stringify(payload);

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });

  res.end(body);
}

function parseJsonBody(req: IncomingMessage): Promise<JsonValue> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve(null);
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON payload"));
      }
    });

    req.on("error", (error) => reject(error));
  });
}

export async function requestHandler(req: IncomingMessage, res: ServerResponse) {
  try {
    const parsedUrl = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);

    if (req.method !== "POST" || parsedUrl.pathname !== "/replace") {
      buildJsonResponse(res, 404, { error: "Not found" });
      return;
    }

    const maxReplacements = parseMaxReplacements(parsedUrl.searchParams.get("maxReplacements"));
    const payload = await parseJsonBody(req);
    const { data, noOfReplacements, limitReached } = replaceDogWithCat(payload, maxReplacements);

    buildJsonResponse(res, 200, {
      success: true,
      maxReplacements,
      noOfReplacements,
      limitReached,
      payload: data,
    });
  } catch (error) {
    buildJsonResponse(res, 400, { error: error instanceof Error ? error.message : "Bad request" });
  }
}

export function createServer() {
  const server = http.createServer(requestHandler);
  server.keepAliveTimeout = 60_000;
  server.headersTimeout = 65_000;
  server.maxHeadersCount = 2000;

  return server;
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
