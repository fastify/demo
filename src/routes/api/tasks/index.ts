import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { TaskSchema, Task, CreateTaskSchema, UpdateTaskSchema, TaskStatus } from '../../../schemas/tasks.js'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: Type.Array(TaskSchema)
        },
        tags: ['Tasks']
      }
    },
    async function () {
      const tasks = await fastify.knex<Task>('tasks').select('*')
      return tasks
    }
  )

  fastify.get(
    '/:id',
    {
      schema: {
        params: Type.Object({
          id: Type.Number()
        }),
        response: {
          200: TaskSchema,
          404: Type.Object({ message: Type.String() })
        },
        tags: ['Tasks']
      }
    },
    async function (request, reply) {
      const { id } = request.params
      const task = await fastify.knex<Task>('tasks').where({ id }).first()

      if (!task) {
        return reply.notFound('Task not found')
      }

      return task
    }
  )

  fastify.post(
    '/',
    {
      schema: {
        body: CreateTaskSchema,
        response: {
          201: {
            id: Type.Number()
          }
        },
        tags: ['Tasks']
      }
    },
    async function (request, reply) {
      const newTask = { ...request.body, status: TaskStatus.New }
      const [id] = await fastify.knex<Task>('tasks').insert(newTask)

      reply.code(201)
      return { id }
    }
  )

  fastify.patch(
    '/:id',
    {
      schema: {
        params: Type.Object({
          id: Type.Number()
        }),
        body: UpdateTaskSchema,
        response: {
          200: TaskSchema,
          404: Type.Object({ message: Type.String() })
        },
        tags: ['Tasks']
      }
    },
    async function (request, reply) {
      const { id } = request.params
      const affectedRows = await fastify.knex<Task>('tasks')
        .where({ id })
        .update(request.body)

      if (affectedRows === 0) {
        return reply.notFound('Task not found')
      }

      const updatedTask = await fastify.knex<Task>('tasks').where({ id }).first()
      return updatedTask
    }
  )

  fastify.delete(
    '/:id',
    {
      schema: {
        params: Type.Object({
          id: Type.Number()
        }),
        response: {
          204: Type.Null(),
          404: Type.Object({ message: Type.String() })
        },
        tags: ['Tasks']
      },
      preHandler: fastify.isAdmin
    },
    async function (request, reply) {
      const { id } = request.params
      const affectedRows = await fastify.knex<Task>('tasks').where({ id }).delete()

      if (affectedRows === 0) {
        return reply.notFound('Task not found')
      }

      reply.code(204).send(null)
    }
  )

  fastify.post(
    '/:id/assign',
    {
      schema: {
        params: Type.Object({
          id: Type.Number()
        }),
        body: Type.Object({
          userId: Type.Optional(Type.Number())
        }),
        response: {
          200: TaskSchema,
          404: Type.Object({ message: Type.String() })
        },
        tags: ['Tasks']
      },
      preHandler: fastify.isModerator
    },
    async function (request, reply) {
      const { id } = request.params
      const { userId } = request.body

      const task = await fastify.knex<Task>('tasks').where({ id }).first()
      if (!task) {
        return reply.notFound('Task not found')
      }

      await fastify.knex('tasks')
        .where({ id })
        .update({ assigned_user_id: userId ?? null })

      task.assigned_user_id = userId

      return task
    }
  )
}

export default plugin
