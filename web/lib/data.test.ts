import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { getRuns } from "./data.ts";

const realFetch = globalThis.fetch;

beforeEach(() => {
  process.env.SUPABASE_URL = "https://x.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

test("a network failure is tried again once", async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("fetch failed");
    return new Response("[]", { status: 200 });
  }) as typeof fetch;
  assert.deepEqual(await getRuns(), []);
  assert.equal(calls, 2);
});

test("a second network failure reaches the error screen", async () => {
  globalThis.fetch = (async () => {
    throw new TypeError("fetch failed");
  }) as typeof fetch;
  await assert.rejects(getRuns(), /fetch failed/);
});

test("the key goes only in the apikey header", async () => {
  let headers: Record<string, string> = {};
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    headers = init.headers as Record<string, string>;
    return new Response("[]", { status: 200 });
  }) as unknown as typeof fetch;
  await getRuns();
  assert.deepEqual(headers, { apikey: "sb_publishable_test" });
});
