import { Type } from "@sinclair/typebox";

export const TaskSchema = Type.Object({
  id: Type.Number(),
  name: Type.String()
});
