import fp from 'fastify-plugin'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifySwagger from '@fastify/swagger'

export default fp(async function (fastify) {
  /**
   * A Fastify plugin for serving Swagger (OpenAPI v2) or OpenAPI v3 schemas
   *
   * @see {@link https://github.com/fastify/fastify-swagger}
   */
  await fastify.register(fastifySwagger, {
    hideUntagged: true,
    openapi: {
      info: {
        title: 'Fastify demo API',
        description: 'The official Fastify demo API',
        version: '0.0.0'
      }
    }
  })

  /**
   * A Fastify plugin for serving Swagger UI.
   *
   * @see {@link https://github.com/fastify/fastify-swagger-ui}
   */
  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/api/docs'
  })
})
