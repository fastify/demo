/**
 * If you would like to turn your application into a standalone executable, look at server.js file
 */

import path from "node:path";
import fastifyAutoload from "@fastify/autoload";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

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
  delete opts.skipOverride // This option only serves testing purpose
  // This loads all external plugins defined in plugins/external
  // those should be registered first as your custom plugins might depend on them
  await fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "plugins/external"),
    options: { ...opts }
  });

  // This loads all your custom plugins defined in plugins/custom
  // those should be support plugins that are reused
  // through your application
  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "plugins/custom"),
    options: { ...opts }
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "routes"),
    autoHooks: true,
    cascadeHooks: true,
    options: { ...opts }
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

    reply.code(err.statusCode ?? 500);

    let message = "Internal Server Error";
    if (err.statusCode === 401) {
      message = err.message;
    }

    return { message };
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
  });
}
