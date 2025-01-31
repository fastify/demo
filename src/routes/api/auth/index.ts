import {
  FastifyPluginAsyncTypebox,
  Type
} from '@fastify/type-provider-typebox'
import { CredentialsSchema, Auth } from '../../../schemas/auth.js'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
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
      const { email, password } = request.body

      return fastify.knex.transaction(async (trx) => {
        const user = await trx<Auth>('users')
          .select('id', 'username', 'email', 'password')
          .where({ email })
          .first()

        if (user) {
          const isPasswordValid = await fastify.compare(
            password,
            user.password
          )
          if (isPasswordValid) {
            const roles = await trx<{ name: string }>('roles')
              .select('roles.name')
              .join('user_roles', 'roles.id', '=', 'user_roles.role_id')
              .join('users', 'user_roles.user_id', '=', 'users.id')
              .where('users.email', user.email)

            request.session.user = {
              id: user.id,
              email: user.email,
              username: user.username,
              roles: roles.map((role) => role.name)
            }

            await request.session.save()

            return { success: true }
          }
        }

        reply.status(401)

        return { message: 'Invalid email or password.' }
      }).catch(() => {
        reply.internalServerError('Transaction failed.')
      })
    }
  )
}

export default plugin
