/**
 * This file is here only to show you how to proceed if you would
 * like to turn your application into a standalone executable.
 */

import Fastify from 'fastify'

// Import library to exit fastify process, gracefully (if possible)
import closeWithGrace from 'close-with-grace'

// Import your application as a normal plugin.
import appService from './app.js'

// Instantiate Fastify with some config
const app = Fastify({
  logger: true
})

async function init () {
  // Register your application as a normal plugin.
  app.register(appService)

  // Delay is the number of milliseconds for the graceful close to finish
  const closeListeners = closeWithGrace({ delay: process.env.FASTIFY_CLOSE_GRACE_DELAY || 500 }, async ({ err }) => {
    if (err) {
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
  app.listen({ port: process.env.PORT || 3000 }, (err) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
  })
}

init()
