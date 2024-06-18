import { test } from "node:test";
import assert from "node:assert";
import { build } from "../../../helper.js";

test("GET /api/tasks with valid JWT Token should return 200", async (t) => {
  const app = await build(t);

  const res = await app.injectWithLogin("basic", {
    method: "GET",
    url: "/api/tasks"
  });

  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(res.payload), [
    { id: 1, name: "Do something..." }
  ]);
});
