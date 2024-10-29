import {
  FastifyPluginAsyncTypebox,
  Type
} from '@fastify/type-provider-typebox'
import { Auth } from '../../../schemas/auth.js'
import { UpdateCredentialsSchema } from '../../../schemas/users.js'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.put(
    '/update-password',
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
        tags: ['User']
      }
    },
    async function (request, reply) {
      const { newPassword, currentPassword } = request.body
      const username = request.session.user.username

      try {
        const user = await fastify.knex<Auth>('users')
          .select('username', 'password')
          .where({ username })
          .first()

        if (user) {
          const isPasswordValid = await fastify.compare(currentPassword, user.password)

          if (isPasswordValid) {
            const hashedPassword = await fastify.hash(newPassword)

            await fastify.knex('users')
              .update({
                password: hashedPassword
              })
              .where({ username })

            return { message: 'Password updated successfully' }
          }
        }

        reply.status(401)
        return { message: 'Invalid username or password.' }
      } catch (error) {
        reply.internalServerError('An error occurred while updating the password.')
      }
    }
  )
}

export default plugin
