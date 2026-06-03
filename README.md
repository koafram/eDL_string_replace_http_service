# JSON Dog-to-Cat Service

A minimal TypeScript HTTP service that accepts arbitrary JSON payloads and replaces exact string values of X (eg. `dog`) with Y (eg. `cat`).

## Project structure

- `src/index.ts` — cluster bootstrap and app startup
- `src/server.ts` — HTTP server, request parsing, and response handling
- `src/replace.ts` — JSON replacement business logic
- `src/config.ts` — runtime defaults and configuration parsing

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