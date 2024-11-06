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
      config: {
        rateLimit: {
          max: 3,
          timeWindow: '1 minute'
        }
      },
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

        if (!user) {
          return reply.code(401).send({ message: 'User does not exist.' })
        }

        const isPasswordValid = await fastify.compare(
          currentPassword,
          user.password
        )

        if (!isPasswordValid) {
          return reply.code(401).send({ message: 'Invalid current password.' })
        }

        if (newPassword === currentPassword) {
          reply.status(400)
          return { message: 'New password cannot be the same as the current password.' }
        }

        const hashedPassword = await fastify.hash(newPassword)
        await fastify.knex('users')
          .update({
            password: hashedPassword
          })
          .where({ username })

        return { message: 'Password updated successfully' }
      } catch (error) {
        reply.internalServerError('An error occurred while updating the password.')
      }
    }
  )
}

export default plugin
