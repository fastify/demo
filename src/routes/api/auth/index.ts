import {
  FastifyPluginAsyncTypebox,
  Type
} from '@fastify/type-provider-typebox'
import { CredentialsSchema, UpdateCredentialsSchema, Credentials, Auth } from '../../../schemas/auth.js'

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
      const { username, password } = request.body

      return fastify.knex.transaction(async (trx) => {
        const user = await trx<Credentials>('users')
          .select('username', 'password')
          .where({ username })
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
              .where('users.username', username)

            request.session.user = {
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
  fastify.post(
    '/update',
    {
      schema: {
        body: UpdateCredentialsSchema,
        response: {
          200: Type.Object({
            message: Type.String()
          }),
          401: Type.Object({
            message: Type.String()
          })
        },
        tags: ['Authentication']
      }
    },
    async function (request, reply) {
      const { username } = request.body
      const user = await fastify.repository.find<Auth>('users', {
        select: 'username, password',
        where: { username }
      })

      if (user) {
        const isPasswordValid = await fastify.compare(request.body.password, user.password)

        if (isPasswordValid) {
          const hashedPassword = await fastify.hash(request.body.newPassword || request.body.password)
          await fastify.repository.update('users', {
            data: { password: hashedPassword, username: request.body.newUsername || request.body.username },
            where: { username }
          })

          return { message: 'Password updated successfully' }
        }
      }

      reply.status(401)

      return { message: 'Invalid username or password.' }
    }
  )
}

export default plugin
