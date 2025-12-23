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
    client: 'pg',
    connection: {
      host: fastify.config.POSTGRES_HOST,
      user: fastify.config.POSTGRES_USER,
      password: fastify.config.POSTGRES_PASSWORD,
      database: fastify.config.POSTGRES_DATABASE,
      port: Number(fastify.config.POSTGRES_PORT)
    },
    pool: { min: 2, max: 10 }
  }
}

export default fp(async (fastify: FastifyInstance, opts) => {
  fastify.decorate('knex', knex(opts))

  fastify.addHook('onClose', async (instance) => {
    await instance.knex.destroy()
  })
}, { name: 'knex' })
