import { test } from "node:test";
import assert from "node:assert";
import { build } from "../../helper.js";

test("GET /example", async (t) => {
  const app = await build(t);

  const res = await app.inject({
    url: "/example",
  });

  assert.deepStrictEqual(JSON.parse(res.payload), {
    message: "This is an example",
  });

  app.listen();
});

test("POST /example with valid body", async (t) => {
  const app = await build(t);

  const res = await app.inject({
    method: "POST",
    url: "/example",
    payload: {
      digit: 5,
    },
  });

  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(res.payload), {
    message: "Here is the digit you sent: 5",
  });
});

test("POST /example with invalid body", async (t) => {
  const app = await build(t);

  const testCases = [
    { digit: 10, description: "too high" },
    { digit: -1, description: "too low" },
    { digit: "a", description: "not a number" },
  ];

  for (const testCase of testCases) {
    const res = await app.inject({
      method: "POST",
      url: "/example",
      payload: { digit: testCase.digit },
    });

    assert.strictEqual(
      res.statusCode,
      400,
      `Failed for case: ${testCase.description}`,
    );
  }
});
