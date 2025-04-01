import { it, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { build } from '../../../helper.js'
import { FastifyInstance } from 'fastify'
import { scryptHash } from '../../../../src/plugins/app/password-manager.js'

async function createUser (app: FastifyInstance, userData: Partial<{ username: string; email: string; password: string }>) {
  const [id] = await app.knex('users').insert(userData)
  return id
}

async function deleteUser (app: FastifyInstance, username: string) {
  await app.knex('users').delete().where({ username })
}

async function updatePasswordWithLoginInjection (app: FastifyInstance, username: string, payload: { currentPassword: string; newPassword: string }) {
  return app.injectWithLogin(`${username}@example.com`, {
    method: 'PUT',
    url: '/api/users/update-password',
    payload
  })
}

describe('Users API', async () => {
  const hash = await scryptHash('Password123$')
  let app: FastifyInstance

  beforeEach(async () => {
    app = await build()
  })

  afterEach(async () => {
    await app.close()
  })

  it('Should enforce rate limiting by returning a 429 status after exceeding 3 password update attempts within 1 minute', async () => {
    await createUser(app, { username: 'random-user-0', email: 'random-user-0@example.com', password: hash })

    const loginResponse = await app.injectWithLogin('random-user-0@example.com', {
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'random-user-0@example.com',
        password: 'Password123$'
      }
    })

    app.config = {
      ...app.config,
      COOKIE_SECRET: loginResponse.cookies[0].value
    }

    for (let i = 0; i < 3; i++) {
      const resInner = await app.inject({
        method: 'PUT',
        url: '/api/users/update-password',
        payload: {
          currentPassword: 'Password1234$',
          newPassword: 'Password123$'
        },
        cookies: {
          [app.config.COOKIE_NAME]: loginResponse.cookies[0].value
        }
      })

      assert.strictEqual(resInner.statusCode, 401)
    }

    const res = await app.inject({
      method: 'PUT',
      url: '/api/users/update-password',
      payload: {
        currentPassword: 'Password1234$',
        newPassword: 'Password123$'
      },
      cookies: {
        [app.config.COOKIE_NAME]: loginResponse.cookies[0].value
      }
    })

    assert.strictEqual(res.statusCode, 429)
    await deleteUser(app, 'random-user-0')
  })

  it('Should update the password successfully', async () => {
    await createUser(app, { username: 'random-user-1', email: 'random-user-1@example.com', password: hash })
    const res = await updatePasswordWithLoginInjection(app, 'random-user-1', {
      currentPassword: 'Password123$',
      newPassword: 'NewPassword123$'
    })

    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Password updated successfully' })

    await deleteUser(app, 'random-user-1')
  })

  it('Should return 400 if the new password is the same as current password', async () => {
    await createUser(app, { username: 'random-user-2', email: 'random-user-2@example.com', password: hash })
    const res = await updatePasswordWithLoginInjection(app, 'random-user-2', {
      currentPassword: 'Password123$',
      newPassword: 'Password123$'
    })

    assert.strictEqual(res.statusCode, 400)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'New password cannot be the same as the current password.' })

    await deleteUser(app, 'random-user-2')
  })

  it('Should return 400 if the newPassword password not match the required pattern', async () => {
    await createUser(app, { username: 'random-user-3', email: 'random-user-3@example.com', password: hash })
    const res = await updatePasswordWithLoginInjection(app, 'random-user-3', {
      currentPassword: 'Password123$',
      newPassword: 'password123$'
    })

    assert.strictEqual(res.statusCode, 400)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'body/newPassword must match pattern "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$"' })

    await deleteUser(app, 'random-user-3')
  })

  it('Should return 401 the current password is incorrect', async () => {
    await createUser(app, { username: 'random-user-4', email: 'random-user-4@example.com', password: hash })
    const res = await updatePasswordWithLoginInjection(app, 'random-user-4', {
      currentPassword: 'WrongPassword123$',
      newPassword: 'Password123$'
    })

    assert.strictEqual(res.statusCode, 401)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Invalid current password.' })

    await deleteUser(app, 'random-user-4')
  })

  it('Should return 401 if user does not exist in the database', async () => {
    await createUser(app, { username: 'random-user-5', email: 'random-user-5@example.com', password: hash })
    const loginResponse = await app.injectWithLogin('random-user-5@example.com', {
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'random-user-5@example.com',
        password: 'Password123$'
      }
    })

    assert.strictEqual(loginResponse.statusCode, 200)

    await deleteUser(app, 'random-user-5')

    app.config = {
      ...app.config,
      COOKIE_SECRET: loginResponse.cookies[0].value
    }

    const res = await app.inject({
      method: 'PUT',
      url: '/api/users/update-password',
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
    await deleteUser(app, 'random-user-5')
  })

  it('Should handle errors gracefully and return 500 Internal Server Error when an unexpected error occurs', async (t) => {
    const { mock: mockKnex } = t.mock.method(app.passwordManager, 'hash')
    mockKnex.mockImplementation(() => {
      throw new Error()
    })

    await createUser(app, { username: 'random-user-6', email: 'random-user-6@example.com', password: hash })

    const res = await updatePasswordWithLoginInjection(app, 'random-user-6', {
      currentPassword: 'Password123$',
      newPassword: 'NewPassword123$'
    })

    assert.strictEqual(res.statusCode, 500)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Internal Server Error' })

    await deleteUser(app, 'random-user-6')
  })
})
