import { Static, Type } from "@sinclair/typebox";

export const TaskTransitions = {
  Start: "start",
  Complete: "complete",
  Hold: "hold",
  Resume: "resume",
  Cancel: "cancel",
  Archive: "archive"
} as const;

export const TaskStatus = {
  New: 'new',
  InProgress: 'in-progress',
  OnHold: 'on-hold',
  Completed: 'completed',
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
  assigned_user_id: Type.Optional(Type.Number())
});

export const UpdateTaskSchema = Type.Object({
  name: Type.Optional(Type.String()),
  assigned_user_id: Type.Optional(Type.Number())
});

export const PatchTaskTransitionSchema = Type.Object({
  transition: Type.Union([
    Type.Literal(TaskTransitions.Start),
    Type.Literal(TaskTransitions.Complete),
    Type.Literal(TaskTransitions.Hold),
    Type.Literal(TaskTransitions.Resume),
    Type.Literal(TaskTransitions.Cancel),
    Type.Literal(TaskTransitions.Archive)
  ])
});
