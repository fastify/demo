import { Type } from '@sinclair/typebox'

const passwordPattern = '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$'

const PasswordSchema = Type.String({
  pattern: passwordPattern,
  minLength: 8
})

export const UpdateCredentialsSchema = Type.Object({
  currentPassword: PasswordSchema,
  newPassword: PasswordSchema
})
