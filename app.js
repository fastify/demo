/**
 * If you would like to turn your application into a standalone executable, look at server.js file
 *
 */

import path from 'node:path'
import fastifyAutoload from '@fastify/autoload'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default async function app (fastify, opts) {
  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(fastifyAutoload, {
    dir: path.join(__dirname, 'plugins'),
    options: { ...opts }
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(fastifyAutoload, {
    dir: path.join(__dirname, 'routes'),
    options: { ...opts }
  })

  fastify.setErrorHandler((err, request, reply) => {
    request.log.error({
      err,
      request: {
        method: request.method,
        url: request.url,
        query: request.query,
        params: request.params
      }
    }, 'Unhandled error occurred')

    reply.code(err.statusCode ?? 500)

    return { message: 'Internal Server Error' }
  })

  fastify.setNotFoundHandler((request, reply) => {
    request.log.warn({
      request: {
        method: request.method,
        url: request.url,
        query: request.query,
        params: request.params
      }
    }, 'Resource not found')

    reply.code(404)

    return { message: 'Not Found' }
  })
}
