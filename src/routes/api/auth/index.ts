import {
  FastifyPluginAsyncTypebox,
  Type
} from '@fastify/type-provider-typebox'
import { CredentialsSchema } from '../../../schemas/auth.js'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { usersRepository } = fastify
  fastify.post(
    '/login',
    {
      schema: {
        body: CredentialsSchema,
        response: {
          200: Type.Object({
            success: Type.Boolean(),
            message: Type.Optional(Type.String())
          }),
          401: Type.Object({
            message: Type.String()
          })
        },
        tags: ['Authentication']
      }
    },
    async function (request, reply) {
      const { username, password } = request.body

      return fastify.knex.transaction(async (trx) => {
        const user = await usersRepository.findByUsername(username, trx)

        if (user) {
          const isPasswordValid = await fastify.compare(
            password,
            user.password
          )
          if (isPasswordValid) {
            const roles = await usersRepository.findUserRolesByUsername(username, trx)

            request.session.user = {
              id: user.id,
              username,
              roles: roles.map((role) => role.name)
            }

            await request.session.save()

            return { success: true }
          }
        }

        reply.status(401)

        return { message: 'Invalid username or password.' }
      }).catch(() => {
        reply.internalServerError('Transaction failed.')
      })
    }
  )
}

export default plugin
