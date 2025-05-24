import { FastifyInstance } from 'fastify'
import { Knex } from 'knex'
import fp from 'fastify-plugin'
import { Auth } from '../../../schemas/auth.js'

declare module 'fastify' {
  interface FastifyInstance {
    usersRepository: ReturnType<typeof createUsersRepository>;
  }
}

export function createUsersRepository (fastify: FastifyInstance) {
  const knex = fastify.knex

  return {
    async findByEmail (email: string, trx?: Knex) {
      const user: Auth & { password: string } = await (trx ?? knex)('users')
        .select('id', 'username', 'password', 'email')
        .where({ email })
        .first()

      return user
    },

    async updatePassword (email: string, hashedPassword: string) {
      return knex('users')
        .update({ password: hashedPassword })
        .where({ email })
    },

    async findUserRolesByEmail (email: string, trx: Knex) {
      const roles: ({ name: string })[] = await trx('roles')
        .select('roles.name')
        .join('user_roles', 'roles.id', '=', 'user_roles.role_id')
        .join('users', 'user_roles.user_id', '=', 'users.id')
        .where('users.email', email)

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
