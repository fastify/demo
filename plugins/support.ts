import fp from "fastify-plugin";

/**
 * The use of fastify-plugin is required to be able
 * to export the decorators to the outer scope
 *
 * @see https://github.com/fastify/fastify-plugin
 */
export default fp(async function (fastify) {
  fastify.decorate("someSupport", function () {
    return "hugs";
  });
});
