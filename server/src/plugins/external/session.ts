import fastifySession from '@fastify/session'
import fp from 'fastify-plugin'
import { Auth } from '../../schemas/auth.js'
import fastifyCookie from '@fastify/cookie'

declare module 'fastify' {
  interface Session {
    user: Auth
  }
}

/**
 * This plugins enables the use of session.
 *
 * @see {@link https://github.com/fastify/session}
 */
export default fp(async (fastify) => {
  fastify.register(fastifyCookie)
  fastify.register(fastifySession, {
    secret: fastify.config.COOKIE_SECRET,
    cookieName: fastify.config.COOKIE_NAME,
    cookie: {
      secure: fastify.config.COOKIE_SECURED,
      httpOnly: true,
      maxAge: 1800000
    }
  })
}, {
  name: 'session'
})
