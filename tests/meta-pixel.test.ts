import assert from "node:assert/strict";
import test from "node:test";
import { trackMetaLead } from "../src/lib/metaPixel.ts";

test("não dispara Lead quando o Pixel da Meta não está disponível", () => {
  assert.equal(trackMetaLead(), false);
});

test("dispara Lead uma vez quando o Pixel da Meta está disponível", () => {
  const calls: unknown[][] = [];

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      fbq: (...args: unknown[]) => calls.push(args),
    },
  });

  try {
    assert.equal(trackMetaLead(), true);
    assert.deepEqual(calls, [["track", "Lead"]]);
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
});
