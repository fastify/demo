import { Type } from '@sinclair/typebox'

const atLeastOneUpperCasePattern = '(?=.*?[A-Z])'
const atLeastOneLowerCasePattern = '(?=.*?[a-z])'
const atLeastOneNumericPattern = '(?=.*?[0-9])'
const atLeastOneSpecialCharPattern = '(?=.*?[#?!@$%^&*-])'

const passwordPattern = `^${atLeastOneUpperCasePattern}${atLeastOneLowerCasePattern}${atLeastOneNumericPattern}${atLeastOneSpecialCharPattern}$`

const Password = Type.String({
  pattern: passwordPattern,
  minLength: 8
})

export const UpdateCredentialsSchema = Type.Object({
  currentPassword: Password,
  newPassword: Password
})
