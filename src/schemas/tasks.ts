import { Static, Type } from '@sinclair/typebox'

export const TaskStatusEnum = {
  New: 'new',
  InProgress: 'in-progress',
  OnHold: 'on-hold',
  Completed: 'completed',
  Canceled: 'canceled',
  Archived: 'archived'
} as const

export type TaskStatusType = typeof TaskStatusEnum[keyof typeof TaskStatusEnum]

const TaskStatusSchema = Type.Union([
  Type.Literal('new'),
  Type.Literal('in-progress'),
  Type.Literal('on-hold'),
  Type.Literal('completed'),
  Type.Literal('canceled'),
  Type.Literal('archived')
])

export const TaskSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  author_id: Type.Number(),
  assigned_user_id: Type.Optional(Type.Number()),
  status: TaskStatusSchema,
  created_at: Type.String({ format: 'date-time' }),
  updated_at: Type.String({ format: 'date-time' })
})

export interface Task extends Static<typeof TaskSchema> {
  filename?: string
}

export const CreateTaskSchema = Type.Object({
  name: Type.String(),
  author_id: Type.Number(),
  assigned_user_id: Type.Optional(Type.Number())
})

export const UpdateTaskSchema = Type.Object({
  name: Type.Optional(Type.String()),
  assigned_user_id: Type.Optional(Type.Number())
})

export const QueryTaskPaginationSchema = Type.Object({
  page: Type.Number({ minimum: 1, default: 1 }),
  limit: Type.Number({ minimum: 1, maximum: 100, default: 10 }),

  author_id: Type.Optional(Type.Number()),
  assigned_user_id: Type.Optional(Type.Number()),
  status: Type.Optional(TaskStatusSchema),
  order: Type.Optional(Type.Union([
    Type.Literal('asc'),
    Type.Literal('desc')
  ], { default: 'desc' }))
})

export const TaskPaginationResultSchema = Type.Object({
  total: Type.Number({ minimum: 0, default: 0 }),
  tasks: Type.Array(TaskSchema)
})
