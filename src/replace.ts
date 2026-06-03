import { JsonValue, ReplacementResult } from "./models/types";

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
