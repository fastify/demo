export default async function (fastify, opts) {
  fastify.get('/', { schema: { tags: ['Home'] } }, async function (request, reply) {
    return 'Welcome to the official fastify demo!'
  })
}
