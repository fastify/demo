import fp from "fastify-plugin";
import sensible from "@fastify/sensible";

/**
 * This plugin adds some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
export default fp(async function (fastify) {
  fastify.register(sensible, {
    // Set plugin options here
  });
});
