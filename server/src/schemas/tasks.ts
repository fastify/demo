import { Static, Type } from '@sinclair/typebox'
import { DateTimeSchema, IdSchema, StringSchema } from './common.js'

export const TaskStatusEnum = {
  New: 'new',
  InProgress: 'in-progress',
  OnHold: 'on-hold',
  Completed: 'completed',
  Canceled: 'canceled',
  Archived: 'archived'
} as const

export type TaskStatusType = typeof TaskStatusEnum[keyof typeof TaskStatusEnum]

export interface Task extends Static<typeof TaskSchema> {
  filename?: string | null
}

const TaskStatusSchema = Type.Union([
  Type.Literal('new'),
  Type.Literal('in-progress'),
  Type.Literal('on-hold'),
  Type.Literal('completed'),
  Type.Literal('canceled'),
  Type.Literal('archived')
])

export const TaskSchema = Type.Object({
  id: IdSchema,
  name: StringSchema,
  author_id: IdSchema,
  assigned_user_id: Type.Optional(IdSchema),
  status: TaskStatusSchema,
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema
})

export const CreateTaskSchema = Type.Object({
  name: StringSchema,
  assigned_user_id: Type.Optional(IdSchema)
})

export const UpdateTaskSchema = Type.Object({
  name: Type.Optional(StringSchema),
  assigned_user_id: Type.Optional(IdSchema)
})

export const QueryTaskPaginationSchema = Type.Object({
  page: Type.Integer({ minimum: 1, default: 1 }),
  limit: Type.Integer({ minimum: 1, maximum: 100, default: 10 }),
  author_id: Type.Optional(IdSchema),
  assigned_user_id: Type.Optional(IdSchema),
  status: Type.Optional(TaskStatusSchema),
  order: Type.Optional(Type.Union([
    Type.Literal('asc'),
    Type.Literal('desc')
  ], { default: 'desc' }))
})

export const TaskPaginationResultSchema = Type.Object({
  total: Type.Integer({ minimum: 0, default: 0 }),
  tasks: Type.Array(TaskSchema)
})
