import { Type } from '@sinclair/typebox'

const passwordPattern = '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$'

const PasswordSchema = Type.String({
  pattern: passwordPattern,
  minLength: 8,
  errorMessage: {
    pattern: 'The password does not meet the required format (at least one uppercase letter, one lowercase letter, one number and one special character)',
    minLength: 'Password must contain at least 8 characters'
  }
})

export const UpdateCredentialsSchema = Type.Object({
  currentPassword: PasswordSchema,
  newPassword: PasswordSchema
}, {
  errorMessage: {
    required: {
      currentPassword: 'Current password is required',
      newPassword: 'New password is required'
    }
  }
})

// same error with vanilla ajv schema
export const AjvUpdateCredentialsSchema = {
  type: 'object',
  properties: {
    currentPassword: {
      type: 'string',
      pattern: passwordPattern,
      minLength: 8,
      errorMessage: {
        pattern: 'Invalid current password pattern',
        minLength: 'Current password is too short'
      }
    },
    newPassword: {
      type: 'string',
      pattern: passwordPattern,
      minLength: 8,
      errorMessage: {
        pattern: 'Invalid new password pattern',
        minLength: 'New password is too short'
      }
    }
  },
  required: ['currentPassword', 'newPassword'],
  errorMessage: {
    required: {
      currentPassword: 'Current password is required',
      newPassword: 'New password is required'
    }
  }
}
