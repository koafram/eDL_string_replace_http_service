import http, { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";

import { replaceDogWithCat } from "./replace";
import { parseMaxReplacements } from "./config/config";
import { JsonValue } from "./models/types";

export function createServer() {
  const server = http.createServer(requestHandler);
  server.keepAliveTimeout = 60_000;
  server.headersTimeout = 65_000;
  server.maxHeadersCount = 2000;

  return server;
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

function buildJsonResponse(res: ServerResponse, statusCode: number, payload: JsonValue) {
  const body = JSON.stringify(payload);

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });

  res.end(body);
}

export async function requestHandler(req: IncomingMessage, res: ServerResponse) {
  try {
    const parsedUrl = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);

    if (req.method !== "POST" || parsedUrl.pathname !== "/replace-dog-cat") {
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
