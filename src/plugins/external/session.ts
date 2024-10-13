import fastifySession, { FastifySessionOptions } from '@fastify/session'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { Auth } from '../../schemas/auth.js'

declare module 'fastify' {
  interface Session {
    user: Auth
  }
}

export const autoConfig = (
  fastify: FastifyInstance
): FastifySessionOptions => ({
  secret: fastify.config.COOKIE_SECRET,
  cookieName: fastify.config.COOKIE_NAME,
  cookie: {
    secure: fastify.config.COOKIE_SECURED,
    httpOnly: true,
    maxAge: 1800000 // 30 minutes
  }
})

/**
 * This plugins enables the use of session.
 *
 * @see {@link https://github.com/fastify/session}
 */
export default fp(fastifySession, {
  name: 'session',
  dependencies: ['cookies']
})
