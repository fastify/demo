import { FastifyInstance } from 'fastify'
import { Authenticate, kAuthenticate } from '../../plugins/app/authentication.js'

export default async function (fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/api/auth/login')) {
      return
    }

    const success = request.getDecorator<Authenticate>(kAuthenticate)()
    if (!success) {
      return reply.unauthorized('You must be authenticated to access this route.')
    }
  })
}
