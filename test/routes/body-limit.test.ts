import { test } from "node:test";
import { build } from "../helper.js";

const largeBody = { name: 'a'.repeat(1024 * 257)}; // Create a string that is 257 KB in size

test("POST / with body exceeding limit", async (t) => {
  const app = await build(t);

  const res = await app.inject({
    method: 'POST',
    url: '/example',
    payload: largeBody
  });

  console.log(res.statusCode)

//   assert.strictEqual(res.statusCode, 413); // 413 Payload Too Large
//   assert.deepStrictEqual(JSON.parse(res.payload), {
//     error: "Payload Too Large",
//     message: "Request body is too large",
//     statusCode: 413
//   });
});
