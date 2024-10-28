import { Static, Type } from '@sinclair/typebox'

export const CredentialsSchema = Type.Object({
  username: Type.String(),
  password: Type.String()
})

export interface Credentials extends Static<typeof CredentialsSchema> {}

export interface Auth extends Omit<Credentials, 'password'> {
  roles: string[]
}

export const UpdateCredentialsSchema = Type.Object({
    username: Type.String(),
    password: Type.String(),
    newUsername: Type.Optional(Type.String()),
    newPassword: Type.Optional(Type.String())
})
