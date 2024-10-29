import { Type } from '@sinclair/typebox'

export const UpdateCredentialsSchema = Type.Object({
  currentPassword: Type.String(),
  newPassword: Type.String()
})
