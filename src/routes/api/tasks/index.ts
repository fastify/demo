import {
  FastifyPluginAsyncTypebox,
  Type
} from '@fastify/type-provider-typebox'
import {
  TaskSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskStatusEnum,
  QueryTaskPaginationSchema,
  TaskPaginationResultSchema
} from '../../../schemas/tasks.js'
import path from 'node:path'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { tasksRepository, tasksFileManager } = fastify
  fastify.get(
    '/',
    {
      schema: {
        querystring: QueryTaskPaginationSchema,
        response: {
          200: TaskPaginationResultSchema
        },
        tags: ['Tasks']
      }
    },
    async function (request) {
      return tasksRepository.paginate(request.query)
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
      const task = await tasksRepository.findById(id)

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
      const newTask = {
        ...request.body,
        author_id: request.session.user.id,
        status: TaskStatusEnum.New
      }

      const id = await tasksRepository.create(newTask)

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
      const updatedTask = await tasksRepository.update(id, request.body)

      if (!updatedTask) {
        return reply.notFound('Task not found')
      }

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
      preHandler: (request, reply) => request.isAdmin(reply)
    },
    async function (request, reply) {
      const deleted = await tasksRepository.delete(request.params.id)
      if (!deleted) {
        return reply.notFound('Task not found')
      }

      return reply.code(204).send(null)
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
      preHandler: (request, reply) => request.isModerator(reply)
    },
    async function (request, reply) {
      const { id } = request.params

      const task = await tasksRepository.findById(id)
      if (!task) {
        return reply.notFound('Task not found')
      }

      const { userId } = request.body
      await tasksRepository.update(id, { assigned_user_id: userId ?? null })

      task.assigned_user_id = userId

      return task
    }
  )

  fastify.post(
    '/:id/upload',
    {
      schema: {
        params: Type.Object({
          id: Type.Number()
        }),
        consumes: ['multipart/form-data'],
        response: {
          200: Type.Object({
            message: Type.String()
          }),
          404: Type.Object({ message: Type.String() }),
          400: Type.Object({ message: Type.String() })
        },
        tags: ['Tasks']
      }
    },
    async function (request, reply) {
      const { id } = request.params

      return fastify.knex
        .transaction(async (trx) => {
          const file = await request.file()
          if (!file) {
            return reply.notFound('File not found')
          }

          if (file.file.truncated) {
            return reply.badRequest('File size limit exceeded')
          }

          const allowedMimeTypes = ['image/jpeg', 'image/png']
          if (!allowedMimeTypes.includes(file.mimetype)) {
            return reply.badRequest('Invalid file type')
          }

          const filename = `${id}_${file.filename}`

          const updatedTask = await tasksRepository.update(id, { filename }, trx)
          if (!updatedTask) {
            return reply.notFound('Task not found')
          }

          await tasksFileManager.upload(filename, file)

          return { message: 'File uploaded successfully' }
        })
        .catch(() => {
          reply.internalServerError('Transaction failed.')
        })
    }
  )

  fastify.get(
    '/:filename/image',
    {
      schema: {
        params: Type.Object({
          filename: Type.String()
        }),
        response: {
          200: { type: 'string', contentMediaType: 'image/*' },
          404: Type.Object({ message: Type.String() })
        },
        tags: ['Tasks']
      }
    },
    async function (request, reply) {
      const { filename } = request.params

      const task = await tasksRepository.findByFilename(filename)
      if (!task) {
        return reply.notFound(`No task has filename "${filename}"`)
      }

      return reply.sendFile(
        task.filename as string,
        path.join(
          fastify.config.UPLOAD_DIRNAME,
          fastify.config.UPLOAD_TASKS_DIRNAME
        )
      )
    }
  )

  fastify.delete(
    '/:filename/image',
    {
      schema: {
        params: Type.Object({
          filename: Type.String()
        }),
        response: {
          204: Type.Null(),
          404: Type.Object({ message: Type.String() })
        },
        tags: ['Tasks']
      }
    },
    async function (request, reply) {
      const { filename } = request.params

      return fastify.knex
        .transaction(async (trx) => {
          const hasBeenUpdated = await tasksRepository.deleteFilename(filename, null, trx)

          if (!hasBeenUpdated) {
            return reply.notFound(`No task has filename "${filename}"`)
          }

          await tasksFileManager.delete(filename)

          reply.code(204)

          return { message: 'File deleted successfully' }
        })
        .catch(() => {
          reply.internalServerError('Transaction failed.')
        })
    }
  )
}

export default plugin
