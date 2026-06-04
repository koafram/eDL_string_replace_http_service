import { describe, it } from "mocha";
import assert from "node:assert";
import { DEFAULT_MAX_REPLACEMENTS } from "../config/config";
import { parseMaxReplacements } from "../utils/functions";

describe("parseMaxReplacements", () => {
  it("returns the default value when no query parameter is provided", () => {
    assert.strictEqual(parseMaxReplacements(null), DEFAULT_MAX_REPLACEMENTS);
  });

  it("accepts non-negative integer strings", () => {
    assert.strictEqual(parseMaxReplacements("0"), 0);
    assert.strictEqual(parseMaxReplacements("42"), 42);
  });

  it("accepts whitespace-padded integers", () => {
    assert.strictEqual(parseMaxReplacements(" 5 "), 5);
  });

  it("rejects invalid values", () => {
    for (const value of ["-1", "1.5", "foo"]) {
      assert.throws(() => parseMaxReplacements(value), {
        message: /maxReplacements must be a non-negative integer/,
      });
    }
  });
});
