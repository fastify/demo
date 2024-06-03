export default async function (fastify, opts) {
  // is prefixed with /example by the autoloader
  fastify.get('/', async function (request, reply) {
    return 'this is an example'
  })
}
