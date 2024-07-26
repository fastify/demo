import { it } from "node:test";
import assert from "node:assert";
import { build } from "../helper.js";

it("should call notFoundHandler", async (t) => {
  const app = await build(t);

  const res = await app.inject({
    method: "GET",
    url: "/this-route-does-not-exist"
  });

  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(JSON.parse(res.payload), { message: "Not Found" });
});
