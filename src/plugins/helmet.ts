import fp from "fastify-plugin";
import helmet from "@fastify/helmet";

/**
 * This plugins sets the basic security headers.
 *
 * @see https://github.com/fastify/fastify-helmet
 */
export default fp(async function (fastify) {
  fastify.register(helmet, {
    // Set plugin options here
  });
});
