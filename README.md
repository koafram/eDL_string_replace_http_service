# JSON Dog-to-Cat Service

A minimal TypeScript HTTP service that accepts arbitrary JSON payloads and replaces exact string values of X (eg. `dog`) with Y (eg. `cat`).

## Project structure

- `src/index.ts` — cluster bootstrap and app startup
- `src/server.ts` — HTTP server, request parsing and response handling
- `src/replace.ts` — JSON replacement business logic
- `src/config/config.ts` — runtime defaults and configuration parsing

## Features

- POST `/replace-dog-cat` accepts arbitrary JSON payloads
- Exact string values of `dog` are replaced with `cat`
- Configurable replacement limit via query param or environment variable
- Built-in cluster support for high traffic

## Usage

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Run:

```bash
npm start
```

Run in development mode:

```bash
npm run dev
```

## Configuration

- `PORT` — server port (default `3000`)
- `MAX_REPLACEMENTS` — default replacement limit for all requests
- `WORKER_COUNT` — number of cluster workers (defaults to CPU core count)

## Example Request

```bash
curl -X POST http://localhost:3000/replace-dog-cat \
  -H "Content-Type: application/json" \
  -d '{"pet":"dog","nested":{"type":"dog"},"list":["dog", "cat"]}'
```

Expected response:

```json
{
  "success": true,
  "maxReplacements": 10000,
  "replacements": 3,
  "limitReached": false,
  "payload": {
    "pet": "cat",
    "nested": {"type": "cat"},
    "list": ["cat", "cat"]
  }
}
```


Assumptions Made
-----------------
- The input is valid JSON and can contain nested objects and arrays.
- The endpoint should accept arbitrary JSON payloads and preserve non-string values.
- Only exact string values equal to "dog" should be replaced with "cat"; variations such as "doggy" or strings containing "dog" will not be changed.
- The replacement limit is applied globally across the entire JSON payload, not per object or array.
- High traffic is addressed via Node.js clustering rather than an external load balancer or via an advanced HTTP framework.
- The service is intended as a simple, portable prototype and does not require authentication or authorization.

Trade-offs
-----------
- Used raw Node.js `http` instead of a higher-level framework like Express to keep the service lightweight and avoid extra dependencies.
- Chose a full recursive copy of the payload for immutability; this is predictable, simple and safe but not the most memory-efficient for very large payloads.
- Applied a single global replacement limit per request instead of more granular quotas to keep the API straightforward.
- The implementation stops searching once the replacement limit is reached, reducing unnecessary work on large payloads. The trade-off is slightly more complex traversal logic.
- Used query parameters for runtime options rather than a richer JSON schema or configuration management.

What I would do with more time
-------------------------------
- Support configurable search and replacement values rather than hardcoding "dog" and "cat".
- Add request validation and schema awareness/enforcement, possibly with JSON Schema, Joi or Zod, to provide clearer error messages.
- Introduce request/response logging and metrics collection (e.g. Prometheus) for production observability.
- Add more end-to-end and unit tests for the replacement logic, request parser and worker lifecycle.
- Implement graceful shutdown and health-check endpoints for deployment in containerized environments.
- Consider streaming JSON parsing for very large payloads to reduce memory usage. In other words, replace recursion with an iterative traversal strategy to handle arbitrarily deep JSON safely.
- Add rate limiting and request throttling to better handle high-traffic scenarios.
