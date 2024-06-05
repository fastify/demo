import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  // Prefixed with /example by the autoloader
  fastify.get('/', {
    schema: {
      response: {
        200: Type.Object({
          message: Type.String()
        })
      },
      tags: ['Example']
    }
  }, async function (request, reply) {
    return { message: 'This is an example' }
  })
}

export default plugin
