import { FastifyInstance } from "fastify";
import fastifyUnderPressure, {
  UnderPressureOptions,
} from "@fastify/under-pressure";
import fp from "fastify-plugin";

const opts = (/* parent: FastifyInstance */) => {
  return {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 100000000,
    maxRssBytes: 100000000,
    maxEventLoopUtilization: 0.98,
    message: "The server is under pressure, retry later!",
    retryAfter: 50,
    // @TODO
    // healthCheck: async function () {
    //   const connection = await parent.mysql.getConnection();
    //   try {
    //     await connection.query("SELECT 1");
    //     return true;
    //   } catch (err) {
    //     throw new Error("Database connection is not available");
    //   } finally {
    //     connection.release();
    //   }
    // },
    // healthCheckInterval: 5000,
  } satisfies UnderPressureOptions;
};

export default fp(async function (fastify: FastifyInstance) {
  fastify.register(fastifyUnderPressure, opts);
});
