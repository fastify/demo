import { Static, Type } from '@sinclair/typebox'

export const CredentialsSchema = Type.Object({
  username: Type.String(),
  password: Type.String()
})

export interface Auth extends Static<typeof CredentialsSchema> {}
