
import { FastifyInstance, InjectOptions } from "fastify";
import { build as buildApplication } from "fastify-cli/helper.js";
import path from "node:path";
import { TestContext } from "node:test";
import { options as serverOptions } from "../src/app.js";

declare module "fastify" {
  interface FastifyInstance {
    login: typeof login;
    injectWithLogin: typeof injectWithLogin
  }
}

const AppPath = path.join(import.meta.dirname, "../src/app.ts");

// Fill in this config with all the configurations
// needed for testing the application
export function config() {
  return {
    skipOverride: true, // Register our application with fastify-plugin
    avoidViteRegistration : true
  };
}

const tokens: Record<string, string> = {}
// We will create different users with different roles
async function login(this: FastifyInstance, username: string) {
  if (tokens[username]) {
    return tokens[username]
  }

  const res = await this.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      username,
      password: "password"
    }
  });

  tokens[username] = JSON.parse(res.payload).token;

  return tokens[username]
}

async function injectWithLogin(this: FastifyInstance, username: string, opts: InjectOptions) {
  opts.headers = {
    ...opts.headers,
    Authorization: `Bearer ${await this.login(username)}`
  };

  return this.inject(opts);
};

// automatically build and tear down our instance
export async function build(t: TestContext) {
  // you can set all the options supported by the fastify CLI command
  const argv = [AppPath];

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  const app = await buildApplication(argv, config(), serverOptions) as FastifyInstance;

  app.login = login;

  app.injectWithLogin = injectWithLogin

  // close the app after we are done
  t.after(() => app.close());

  return app;
}
