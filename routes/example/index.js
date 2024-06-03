export default async function (fastify, opts) {
  // Prefixed with /example by the autoloader
  fastify.get('/', { schema: { tags: ['Home'] } }, async function (request, reply) {
    return 'this is an example'
  })
}
