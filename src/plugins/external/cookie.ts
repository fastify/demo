import fastifyCookie from '@fastify/cookie'
import fp from 'fastify-plugin'

/**
 * This plugins enables the use of cookies.
 *
 * @see {@link https://github.com/fastify/fastify-cookie}
 */
export default fp(fastifyCookie, {
  name: 'cookies'
})
