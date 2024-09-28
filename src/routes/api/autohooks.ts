import { FastifyInstance } from 'fastify'
import { Auth } from '../../schemas/auth.js'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: Auth
  }
}

export default async function (fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request) => {
    if (!request.url.startsWith('/api/auth/login')) {
      await request.jwtVerify()
    }
  })
}
