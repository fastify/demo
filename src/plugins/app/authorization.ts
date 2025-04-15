import fp from 'fastify-plugin'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Auth } from '../../schemas/auth.js'
import { kAuth } from './authentication.js'

export type AuthorizationManager = ReturnType<typeof createChecker>
export const kAuthorizationManager = Symbol('app.authorizationManager')

function createChecker () {
  function ensureHasRole (request: FastifyRequest, reply: FastifyReply, role: string) {
    const { roles } = request.getDecorator<Auth>(kAuth)
    if (!roles.includes(role)) {
      reply.status(403).send('You are not authorized to access this resource.')
    }
  }

  return {
    async ensureIsModerator (request: FastifyRequest, reply: FastifyReply) {
      return ensureHasRole(request, reply, 'moderator')
    },

    async ensureIsAdmin (request: FastifyRequest, reply: FastifyReply) {
      return ensureHasRole(request, reply, 'admin')
    }
  }
}

/**
 * The use of fastify-plugin is required to be able
 * to export the decorators to the outer scope
 *
 * @see {@link https://github.com/fastify/fastify-plugin}
 */
export default fp(
  async function (fastify) {
    fastify.decorate(kAuthorizationManager, createChecker())
  },
  // You should name your plugins if you want to avoid name collisions
  // and/or to perform dependency checks.
  { name: 'authorization' }
)
