import { test } from "tap";
import assert from "node:assert";

import Fastify from "fastify";
import Support from "../../src/plugins/support.js";

test("support works standalone", async () => {
  const fastify = Fastify();
  fastify.register(Support);

  await fastify.ready();
  assert.equal(fastify.someSupport(), "hugs");
});
