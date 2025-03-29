import { FastifyInstance } from 'fastify'
import { User } from '../../../schemas/auth.js'
import { Knex } from 'knex'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    usersRepository: ReturnType<typeof createUsersRepository>;
  }
}

export function createUsersRepository (fastify: FastifyInstance) {
  const knex = fastify.knex

  return {
    async findByUsername (username: string, trx?: Knex) {
      const user: User = await (trx ?? knex)('users')
        .select('id', 'username', 'password')
        .where({ username })
        .first()

      return user
    },

    async updatePassword (username: string, hashedPassword: string) {
      return knex('users')
        .update({ password: hashedPassword })
        .where({ username })
    },

    async findUserRolesByUsername (username: string, trx: Knex) {
      const roles: ({ name: string })[] = await trx('roles')
        .select('roles.name')
        .join('user_roles', 'roles.id', '=', 'user_roles.role_id')
        .join('users', 'user_roles.user_id', '=', 'users.id')
        .where('users.username', username)

      return roles
    }
  }
}

export default fp(
  async function (fastify: FastifyInstance) {
    const repo = createUsersRepository(fastify)
    fastify.decorate('usersRepository', repo)
  },
  {
    name: 'users-repository',
    dependencies: ['knex']
  }
)
