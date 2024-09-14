/**
 * If you would like to turn your application into a standalone executable, look at server.js file
 */

import path from "node:path";
import fastifyAutoload from "@fastify/autoload";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import fastifyVite from "@fastify/vite";

export const options = {
  ajv: {
    customOptions: {
      coerceTypes: "array",
      removeAdditional: "all"
    }
  }
};

export default async function serviceApp(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  const { avoidViteRegistration = true } = opts;

  // This loads all external plugins defined in plugins/external
  // those should be registered first as your custom plugins might depend on them
  await fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "plugins/external"),
    options: {}
  });

  // This loads all your custom plugins defined in plugins/custom
  // those should be support plugins that are reused
  // through your application
  await fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "plugins/custom"),
    options: {}
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  await fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "routes"),
    autoHooks: true,
    cascadeHooks: true,
    options: {}
  });

  fastify.setErrorHandler((err, request, reply) => {
    request.log.error(
      {
        err,
        request: {
          method: request.method,
          url: request.url,
          query: request.query,
          params: request.params
        }
      },
      "Unhandled error occurred"
    );

    const statusCode = err.statusCode ?? 500;
    reply.code(statusCode);

    return { message: "Internal Server Error" };
  });

  // An attacker could search for valid URLs if your 404 error handling is not rate limited.
  fastify.setNotFoundHandler(
    {
      preHandler: fastify.rateLimit({
        max: 3,
        timeWindow: 500
      })
    },
    (request, reply) => {
      request.log.warn(
        {
          request: {
            method: request.method,
            url: request.url,
            query: request.query,
            params: request.params
          }
        },
        "Resource not found"
      );

      reply.code(404);

      return { message: "Not Found" };
    }
  );

  await handleVite(fastify, {
    register: !avoidViteRegistration
  });
}

async function handleVite(
  fastify: FastifyInstance,
  { register }: { register: boolean }
) {
  if (!register) {
    // Route must match vite "base": https://vitejs.dev/config/shared-options.html#base
    fastify.get("/", () => {
      return "Vite is not registered.";
    });

    return;
  }
  /* c8 ignore start - We don't launch the spa tests with the api tests */
  // We setup the SPA
  await fastify.register(fastifyVite, function (fastify) {
    return {
      root: path.resolve(import.meta.dirname, "../"),
      dev: fastify.config.FASTIFY_VITE_DEV_MODE,
      spa: true
    };
  });

  // Route must match vite "base": https://vitejs.dev/config/shared-options.html#base
  fastify.get("/", (req, reply) => {
    return reply.html();
  });

  await fastify.vite.ready();
  /* c8 ignore end */
}
