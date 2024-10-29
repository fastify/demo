import { Type } from '@sinclair/typebox'

export const UpdateCredentialsSchema = Type.Object({
  username: Type.String(),
  password: Type.String(),
  newUsername: Type.Optional(Type.String()),
  newPassword: Type.Optional(Type.String())
})
