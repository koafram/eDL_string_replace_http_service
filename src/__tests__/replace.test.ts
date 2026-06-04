import { describe, it } from "mocha";
import assert from "node:assert";
import { replaceStrings } from "../replace";

describe("replace Dog With Cat", () => {
  it("transforms exact dog strings to cat", () => {
  const payload = {
    pet: "dog",
    nested: { type: "dog", other: "doggy" },
    list: ["dog", "cat", 123],
  };

  const result = replaceStrings(payload, 1000, "dog", "cat");

  assert.strictEqual(result.noOfReplacements, 3);
  assert.strictEqual(result.limitReached, false);
  assert.deepStrictEqual(result.data, {
    pet: "cat",
    nested: { type: "cat", other: "doggy" },
    list: ["cat", "cat", 123],
  });
});

  it("does not mutate the original payload", () => {
    const payload = { value: "dog", nested: [{ item: "dog" }] };

    const result = replaceStrings(payload, 10, "dog", "cat");

    assert.strictEqual(result.noOfReplacements, 2);
    assert.deepStrictEqual(payload, { value: "dog", nested: [{ item: "dog" }] });
    assert.deepStrictEqual(result.data, { value: "cat", nested: [{ item: "cat" }] });
  });

  it("respects maxReplacements and preserves remaining structure", () => {
    const payload = { a: "dog", b: "dog", c: "dog", d: "dog" };
    const result = replaceStrings(payload, 2, "dog", "cat");

    assert.strictEqual(result.noOfReplacements, 2);
    assert.strictEqual(result.limitReached, true);
    assert.deepStrictEqual(result.data, { a: "cat", b: "cat", c: "dog", d: "dog" });
  });

  it("does not replace when maxReplacements is zero", () => {
    const payload = { a: "dog", b: "dog" };
    const result = replaceStrings(payload, 0, "dog", "cat");

    assert.strictEqual(result.noOfReplacements, 0);
    assert.strictEqual(result.limitReached, true);
    assert.deepStrictEqual(result.data, { a: "dog", b: "dog" });
  });

  it("leaves non-string values untouched", () => {
    const payload = { a: true, b: null, c: 42, d: ["dog", false] };
    const result = replaceStrings(payload, 10, "dog", "cat");

    assert.deepStrictEqual(result.data, { a: true, b: null, c: 42, d: ["cat", false] });
    assert.strictEqual(result.noOfReplacements, 1);
  });
});
