import { test } from "node:test";
import assert from "node:assert";
import { build } from "../helper.js";

test("example is loaded", async (t) => {
  const app = await build(t);

  const res = await app.inject({
    url: "/example",
  });

  assert.deepStrictEqual(JSON.parse(res.payload), {
    message: "This is an example",
  });

  app.listen()
});
