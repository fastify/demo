import fp from 'fastify-plugin'
import helmet from '@fastify/cors'

/**
 * This plugins enables the use of CORS.
 *
 * @see https://github.com/fastify/fastify-cors
 */
export default fp(async function (fastify, opts) {
  fastify.register(helmet, {
    // Set plugin options here
  })
})
