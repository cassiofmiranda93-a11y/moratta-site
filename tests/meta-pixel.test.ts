import assert from "node:assert/strict";
import test from "node:test";
import { trackMetaLead, trackMetaLeadOnce } from "../src/lib/metaPixel.ts";

test("não dispara Lead quando o Pixel da Meta não está disponível", () => {
  assert.equal(trackMetaLead(), false);
});

test("não interfere no cadastro quando o Pixel da Meta falha", () => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      fbq: () => {
        throw new Error("Pixel bloqueado");
      },
    },
  });

  try {
    assert.equal(trackMetaLead(), false);
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
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

test("não duplica Lead para o mesmo envio bem-sucedido", () => {
  const calls: unknown[][] = [];
  const state = { tracked: false };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      fbq: (...args: unknown[]) => calls.push(args),
    },
  });

  try {
    assert.equal(trackMetaLeadOnce(state), true);
    assert.equal(trackMetaLeadOnce(state), false);
    assert.deepEqual(calls, [["track", "Lead"]]);
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
});
