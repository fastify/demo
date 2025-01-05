import { Static, Type } from '@sinclair/typebox'
import { StringSchema } from './common.js'

export const CredentialsSchema = Type.Object({
  username: StringSchema,
  password: StringSchema
})

export interface Credentials extends Static<typeof CredentialsSchema> {}

export interface Auth extends Omit<Credentials, 'password'> {
  id: number;
  roles: string[]
}
