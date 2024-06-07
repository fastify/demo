import fp from "fastify-plugin";
import cors from "@fastify/cors";

/**
 * This plugins enables the use of CORS.
 *
 * @see https://github.com/fastify/fastify-cors
 */
export default fp(async function (fastify) {
  fastify.register(cors, {
    // Set plugin options here
  });
});
