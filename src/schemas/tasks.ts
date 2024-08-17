import { Static, Type } from "@sinclair/typebox";

export const TaskStatus = {
  New: 'new',
  InProgress: 'in-progress',
  Completed: 'completed',
  OnHold: 'on-hold',
  Canceled: 'canceled',
  Archived: 'archived'
} as const;

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];

export const TaskSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  author_id: Type.Number(),
  assigned_user_id: Type.Optional(Type.Number()),
  status: Type.String(),
  created_at: Type.String({ format: "date-time" }),
  updated_at: Type.String({ format: "date-time" })
});

export interface Task extends Static<typeof TaskSchema> {}

export const CreateTaskSchema = Type.Object({
  name: Type.String(),
  author_id: Type.Number(),
  assigned_user_id: Type.Optional(Type.Number()),
  status: Type.String()
});

export const UpdateTaskSchema = Type.Object({
  name: Type.Optional(Type.String()),
  assigned_user_id: Type.Optional(Type.Number()),
  status: Type.Optional(Type.String())
});

export const PatchTaskStatusSchema = Type.Object({
  status: Type.String()
});
