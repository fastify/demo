import { FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { SessionData } from '../external/session.js'
import { Auth } from '../../schemas/auth.js'

export type Authenticate = OmitThisParameter<typeof authenticate>
export const kAuth = Symbol('app.auth')
export const kAuthenticate = Symbol('app.authenticate')

function authenticate (this: FastifyRequest) {
  const { auth } = this.getDecorator<SessionData>('session')
  if (auth === undefined) {
    return false
  }

  // Instead of accessing the session directly in your application,
  // you should decorate the request.
  // This reduces coupling with the authentication strategy.
  // If you change or add new authentication strategies in the future,
  // `request.auth` remains the single source of truth.
  this.setDecorator<Auth>(kAuth, auth)

  return true
}

/**
 * The use of fastify-plugin is required to be able
 * to export the decorators to the outer scope
 *
 * @see {@link https://github.com/fastify/fastify-plugin}
 */
export default fp(
  async function (fastify) {
    // Always decorate object instances before they are instantiated and used
    // @see https://fastify.dev/docs/latest/Reference/Decorators/#decorators
    fastify.decorateRequest(kAuth, null)
    fastify.decorateRequest(kAuthenticate, authenticate)
  },
  // You should name your plugins if you want to avoid name collisions
  // and/or to perform dependency checks.
  { name: 'authentication' }
)
