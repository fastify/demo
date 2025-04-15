import { FastifyInstance } from 'fastify'
import { Auth } from '../../schemas/auth.js'
import { kAuth } from '../../plugins/app/authentication.js'

export default async function (fastify: FastifyInstance) {
  fastify.get('/', (request) => {
    const { username } = request.getDecorator<Auth>(kAuth)
    return {
      message:
        `Hello ${username}! See documentation at ${request.protocol}://${request.hostname}/documentation`
    }
  })
}
