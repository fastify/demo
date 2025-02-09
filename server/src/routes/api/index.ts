import { FastifyInstance } from 'fastify'

export default async function (fastify: FastifyInstance) {
  fastify.get('/', ({ session, protocol, hostname }) => {
    return {
      message:
        `Hello ${session.user.username}! See documentation at ${protocol}://${hostname}/documentation`
    }
  })
}
