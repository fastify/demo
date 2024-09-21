import fp from 'fastify-plugin'
import fastifyMysql, { MySQLPromisePool } from '@fastify/mysql'
import { FastifyInstance } from 'fastify'

declare module 'fastify' {
  export interface FastifyInstance {
    mysql: MySQLPromisePool;
  }
}

export const autoConfig = (fastify: FastifyInstance) => {
  return {
    promise: true,
    host: fastify.config.MYSQL_HOST,
    user: fastify.config.MYSQL_USER,
    password: fastify.config.MYSQL_PASSWORD,
    database: fastify.config.MYSQL_DATABASE,
    port: Number(fastify.config.MYSQL_PORT)
  }
}

export default fp(fastifyMysql, {
  name: 'mysql'
})
