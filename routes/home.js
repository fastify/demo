export default async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return 'Welcome to the official fastify demo!'
  })
}
