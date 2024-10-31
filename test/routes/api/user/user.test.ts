import { it, describe, before } from 'node:test'
import assert from 'node:assert'
import { build } from '../../../helper.js'
import { FastifyInstance } from 'fastify'

async function createUser (
  app: FastifyInstance,
  userData: Partial<{ username: string; password: string }>
) {
  const [id] = await app.knex('users').insert(userData)
  return id
}

async function deleteUser (
  app: FastifyInstance,
  userData: Partial<{ username: string; password: string }>
) {
  await app.knex('users').delete().where({ username: userData.username })
}

describe('User API', (t) => {
  before(async () => {
    const app = await build()
    const Password123$ = 'ff57faf149a2bcab41bf7ecbbc8ce491.3ce6b34ea3edb3f0a09f811440885bfeda612832c04bfddc9d4b906019d97fa0'

    // Fill the password with the hashed value of `Password123$`
    await createUser(app, {
      username: 'random-user',
      password: Password123$
    })

    await app.close()
  })

  it('Should return 400 if the new password is the same as current password', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('basic', {
      method: 'PUT',
      url: '/api/user/update-password',
      payload: {
        currentPassword: 'Password123$',
        newPassword: 'Password123$'
      }
    })

    assert.strictEqual(res.statusCode, 400)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'New password cannot be the same as the current password.' })
  })

  it('Should return 400 if the newPassword password not match the required pattern', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('basic', {
      method: 'PUT',
      url: '/api/user/update-password',
      payload: {
        currentPassword: 'Password123$',
        newPassword: 'password123$'
      }
    })

    assert.strictEqual(res.statusCode, 400)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'body/newPassword must match pattern "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$"' })
  })

  it('Should return 401 the current password is incorrect', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('basic', {
      method: 'PUT',
      url: '/api/user/update-password',
      payload: {
        currentPassword: 'WrongPassword123$',
        newPassword: 'Password123$'
      }
    })

    assert.strictEqual(res.statusCode, 401)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Invalid current password.' })
  })

  it('Should update the password successfully', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('basic', {
      method: 'PUT',
      url: '/api/user/update-password',
      payload: {
        currentPassword: 'Password123$',
        newPassword: 'NewPassword123$'
      }
    })

    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Password updated successfully' })
  })

  it('Should return 401 if user does not exist in the database', async (t) => {
    const app = await build(t)

    const loginResponse = await app.injectWithLogin('random-user', {
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        username: 'random-user',
        password: 'Password123$'
      }
    })

    assert.strictEqual(loginResponse.statusCode, 200)

    await deleteUser(app, {
      username: 'random-user'
    })

    app.config = {
      ...app.config,
      COOKIE_SECRET: loginResponse.cookies[0].value
    }

    const res = await app.inject({
      method: 'PUT',
      url: '/api/user/update-password',
      payload: {
        currentPassword: 'Password123$',
        newPassword: 'NewPassword123$'
      },
      cookies: {
        [app.config.COOKIE_NAME]: loginResponse.cookies[0].value
      }
    })

    assert.strictEqual(res.statusCode, 401)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'User does not exist.' })
  })
})
