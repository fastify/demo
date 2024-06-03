/**
 * If you would like to turn your application into a standalone executable, lookt at server.js file
 *
 */

import path from 'node:path'
import AutoLoad from '@fastify/autoload'

export default async function app (fastify, opts) {
  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(import.meta.dirname, 'plugins'),
    options: { ...opts }
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(import.meta.dirname, 'routes'),
    options: { ...opts }
  })
}
