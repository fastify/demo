import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

export default fp(async function (fastify, opts) {
  /**
    * A Fastify plugin for serving Swagger (OpenAPI v2) or OpenAPI v3 schemas
    *
    * @see https://github.com/fastify/fastify-swagger
  */
  fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Fastify demo API',
        description: 'The official Fastify demo API',
        version: '0.1.0'
      },
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'apiKey',
            in: 'header'
          }
        }
      },
      externalDocs: {
        url: 'https://swagger.io',
        description: 'Find more info here'
      }
    }
  })

  /**
    * A Fastify plugin for serving Swagger UI.
    *
    * @see https://github.com/fastify/fastify-swagger-ui
  */
  await fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    },
    uiHooks: {
      onRequest: function (request, reply, next) { next() },
      preHandler: function (request, reply, next) { next() }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
    transformSpecificationClone: true
  })
})
