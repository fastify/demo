import { test } from "node:test";
import assert from "node:assert";
import { build } from "../../../helper.js";

test("POST /api/auth/login with valid credentials", async (t) => {
  const app = await build(t);

  const res = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      username: "basic",
      password: "password123$"
    }
  });

  assert.strictEqual(res.statusCode, 200);
  assert.ok(JSON.parse(res.payload).token);
});

test("POST /api/auth/login with invalid credentials", async (t) => {
  const app = await build(t);

  const testCases = [
    {
      username: "invalid_user",
      password: "password",
      description: "invalid username"
    },
    {
      username: "basic",
      password: "wrong_password",
      description: "invalid password"
    },
    {
      username: "invalid_user",
      password: "wrong_password",
      description: "both invalid"
    }
  ];

  for (const testCase of testCases) {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        username: testCase.username,
        password: testCase.password
      }
    });

    assert.strictEqual(
      res.statusCode,
      401,
      `Failed for case: ${testCase.description}`
    );

    assert.deepStrictEqual(JSON.parse(res.payload), {
      message: "Invalid username or password."
    });
  }
});
