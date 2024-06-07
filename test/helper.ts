// This file contains code that we reuse
// between our tests.

import { build as buildApplication } from "fastify-cli/helper.js";
import path from "node:path";
import { TestContext } from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AppPath = path.join(__dirname, "../src/app.ts");

// Fill in this config with all the configurations
// needed for testing the application
export function config() {
  return {};
}

// automatically build and tear down our instance
export async function build(t: TestContext) {
  // you can set all the options supported by the fastify CLI command
  const argv = [AppPath];

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  const app = await buildApplication(argv, config());

  // close the app after we are done
  t.after(() => app.close());

  return app;
}
