import { ReturnType, Static } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import {
  CreateTaskSchema,
  QueryTaskPaginationSchema,
  Task,
  UpdateTaskSchema
} from '../../../schemas/tasks.js'
import { Knex } from 'knex'

declare module 'fastify' {
  export interface FastifyInstance {
    tasksRepository: ReturnType<typeof createRepository>;
  }
}

type CreateTask = Static<typeof CreateTaskSchema>
type UpdateTask = Omit<Static<typeof UpdateTaskSchema>, 'assigned_user_id'> & {
  assigned_user_id?: number | null;
  filename?: string
}

type TaskQuery = Static<typeof QueryTaskPaginationSchema>

function createRepository (fastify: FastifyInstance) {
  const knex = fastify.knex

  return {
    async paginate (q: TaskQuery) {
      const offset = (q.page - 1) * q.limit

      const query = fastify
        .knex<Task & { total: number }>('tasks')
        .select('*')
        .select(fastify.knex.raw('count(*) OVER() as total'))

      if (q.author_id !== undefined) {
        query.where({ author_id: q.author_id })
      }

      if (q.assigned_user_id !== undefined) {
        query.where({ assigned_user_id: q.assigned_user_id })
      }

      if (q.status !== undefined) {
        query.where({ status: q.status })
      }

      const tasks = await query
        .limit(q.limit)
        .offset(offset)
        .orderBy('created_at', q.order)

      return {
        tasks,
        total: tasks.length > 0 ? Number(tasks[0].total) : 0
      }
    },

    async findById (id: number, trx?: Knex) {
      return (trx ?? knex)<Task>('tasks').where({ id }).first()
    },

    async findByFilename (filename: string) {
      return await fastify
        .knex<Task>('tasks')
        .select('filename')
        .where({ filename })
        .first()
    },

    async create (newTask: CreateTask) {
      const [id] = await knex<Task>('tasks').insert(newTask)
      return id
    },

    async update (id: number, changes: UpdateTask, trx?: Knex) {
      const affectedRows = await (trx ?? knex)('tasks')
        .where({ id })
        .update(changes)

      if (affectedRows === 0) {
        return null
      }

      return this.findById(id)
    },

    async deleteFilename (filename: string, value: string | null, trx: Knex) {
      const affectedRows = await trx('tasks')
        .where({ filename })
        .update({ filename: value })

      return affectedRows > 0
    },

    async delete (id: number) {
      const affectedRows = await knex<Task>('tasks').where({ id }).delete()

      return affectedRows > 0
    },

    createStream () {
      return knex.select('*').from('tasks').stream()
    }
  }
}

export default fp(
  function (fastify) {
    fastify.decorate('tasksRepository', createRepository(fastify))
  },
  {
    name: 'tasks-repository',
    dependencies: ['knex']
  }
)
