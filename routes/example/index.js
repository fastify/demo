export default async function (fastify, opts) {
  // Prefixed with /example by the autoloader
  fastify.get('/', { schema: { tags: ['Example'] } }, async function (request, reply) {
    return 'this is an example'
  })
}
