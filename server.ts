/**
 * This file is here only to show you how to proceed if you would
 * like to turn your application into a standalone executable.
 *
 * You can launch it with the command `npm run standalone`
 */

import Fastify from 'fastify'

// Import library to exit fastify process, gracefully (if possible)
import closeWithGrace from 'close-with-grace'

// Import your application as a normal plugin.
import serviceApp from './app.js'

const environment = process.env.NODE_ENV ?? 'production'
const envToLogger = {
  development: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  },
  production: true,
  test: false
}

const app = Fastify({
  logger: envToLogger[environment] ?? true,
  ajv: {
    customOptions: {
      coerceTypes: 'array', // change data type of data to match type keyword
      removeAdditional: 'all',// Remove additional body properties
    },
  },
})

async function init () {
  // Register your application as a normal plugin.
  app.register(serviceApp)

  // console.log(app.config("hello"))

  // Delay is the number of milliseconds for the graceful close to finish
  const closeListeners = closeWithGrace({ delay: process.env.FASTIFY_CLOSE_GRACE_DELAY ?? 500 }, async ({ err }) => {
    if (err != null) {
      app.log.error(err)
    }

    await app.close()
  })

  app.addHook('onClose', (instance, done) => {
    closeListeners.uninstall()
    done()
  })

  await app.ready()

  // Start listening.
  app.listen({ port: process.env.PORT ?? 3000 }, (err) => {
    if (err != null) {
      app.log.error(err)
      process.exit(1)
    }
  })
}

init()
