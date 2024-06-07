import { FastifyInstance } from "fastify";
import fastifyUnderPressure from "@fastify/under-pressure";
import fp from "fastify-plugin";

/**
 * A Fastify plugin for mesuring process load and automatically
 * handle of "Service Unavailable"
 *
 * @see https://github.com/fastify/under-pressure
 *
 * Video on the topic: Do not thrash the event loop
 * @see https://www.youtube.com/watch?v=VI29mUA8n9w
 */
export default fp(
  async function (fastify: FastifyInstance) {
    fastify.register(fastifyUnderPressure, {
      maxEventLoopDelay: 1000,
      maxHeapUsedBytes: 100_000_000,
      maxRssBytes: 100_000_000,
      maxEventLoopUtilization: 0.98,
      message: "The server is under pressure, retry later!",
      retryAfter: 50,
      healthCheck: async () => {
        let connection;
        try {
          connection = await fastify.mysql.getConnection();
          await connection.query("SELECT 1;");
          return true;
        } catch (err) {
          fastify.log.error(err, "healthCheck has failed");
          throw new Error("Database connection is not available");
        } finally {
          connection?.release();
        }
      },
      healthCheckInterval: 5000,
    });
  },
  {
    dependencies: ["db"],
  },
);
