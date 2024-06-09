/**
 * This file is here only to show you how to proceed if you would
 * like to turn your application into a standalone executable.
 *
 * You can launch it with the command `npm run standalone`
 */

import Fastify from "fastify";

// Import library to exit fastify process, gracefully (if possible)
import closeWithGrace from "close-with-grace";

// Import your application as a normal plugin.
import serviceApp from "./app.js";

/**
 * Do not use NODE_ENV to determine what logger (or any env related feature) to use
 * @see https://www.youtube.com/watch?v=HMM7GJC5E2o
 */
function getLoggerOptions() {
  // Only if the program is running in an interactive terminal
  if (process.stdout.isTTY) {
    return {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    };
  }

  // Don't forget to configure it with 
  // a truthy value in production
  return !!process.env.LOGGING;
}

const app = Fastify({
  logger: getLoggerOptions(),
  ajv: {
    customOptions: {
      coerceTypes: "array", // change type of data to match type keyword
      removeAdditional: "all", // Remove additional body properties
    },
  },
});

async function init() {
  // Register your application as a normal plugin.
  app.register(serviceApp);

  // Delay is the number of milliseconds for the graceful close to finish
  const closeListeners = closeWithGrace(
    { delay: process.env.FASTIFY_CLOSE_GRACE_DELAY ?? 500 },
    async ({ err }) => {
      if (err != null) {
        app.log.error(err);
      }

      await app.close();
    },
  );

  app.addHook("onClose", (instance, done) => {
    closeListeners.uninstall();
    done();
  });

  await app.ready();

  // Start listening.
  app.listen({ port: process.env.PORT ?? 3000 }, (err) => {
    if (err != null) {
      app.log.error(err);
      process.exit(1);
    }
  });
}

init();
