import fp from "fastify-plugin";
import fastifyMysql from "@fastify/mysql";

/**
 * This plugin allows using `mysql2` with Fastify.
 *
 * @see https://github.com/fastify/fastify-mysql
 */
export default fp(
  async function (fastify) {
    fastify.register(fastifyMysql, {
      promise: true,
      host: fastify.config.MYSQL_HOST,
      user: fastify.config.MYSQL_USER,
      password: fastify.config.MYSQL_PASSWORD,
      database: fastify.config.MYSQL_DATABASE,
      port: Number(fastify.config.MYSQL_PORT)
    });
  },
  {
    // We need to name this plugin to set it as an `under-pressure` dependency
    name: "mysql"
  }
);
