import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import knex, { Knex } from 'knex'

declare module 'fastify' {
  export interface FastifyInstance {
    knex: Knex;
  }
}

export const autoConfig = (fastify: FastifyInstance) => {
  return {
    client: 'mysql2',
    connection: {
      host: fastify.config.MYSQL_HOST,
      user: fastify.config.MYSQL_USER,
      password: fastify.config.MYSQL_PASSWORD,
      database: fastify.config.MYSQL_DATABASE,
      port: Number(fastify.config.MYSQL_PORT)
    },
    pool: { min: 2, max: 10 }
  }
}

const knexPlugin = async (fastify: FastifyInstance) => {
  const db = knex(autoConfig(fastify))

  fastify.decorate('knex', db)

  fastify.addHook('onClose', async (instance) => {
    await instance.knex.destroy()
  })
}

export default fp(knexPlugin, { name: 'knex' })
