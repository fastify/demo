// This file contains code that we reuse
// between our tests.

import { InjectOptions } from "fastify";
import { build as buildApplication } from "fastify-cli/helper.js";
import path from "node:path";
import { TestContext } from "node:test";

const AppPath = path.join(import.meta.dirname, "../src/app.ts");

// Fill in this config with all the configurations
// needed for testing the application
export function config() {
  return {};
}

// We will create different users with different roles
async function login(username: string) {
  const res = await this.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      username,
      password: "password"
    }
  });

  return JSON.parse(res.payload).token;
}

// automatically build and tear down our instance
export async function build(t: TestContext) {
  // you can set all the options supported by the fastify CLI command
  const argv = [AppPath];

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  const app = await buildApplication(argv, config());

  app.login = login;

  app.injectWithLogin = async (username: string, opts: InjectOptions) => {
    opts.headers = {
      ...opts.headers,
      Authorization: `Bearer ${await app.login(username)}`
    };

    return app.inject(opts);
  };

  // close the app after we are done
  t.after(() => app.close());

  return app;
}
