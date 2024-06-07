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
      port: Number(fastify.config.MYSQL_PORT),
    });
  },
  // You should name your plugins if you want to avoid name collisions
  // and/or to perform dependency checks.
  { name: "db" },
);
