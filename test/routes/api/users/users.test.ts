import { it, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { build } from '../../../helper.js'
import { FastifyInstance } from 'fastify'
import { scryptHash } from '../../../../src/plugins/custom/scrypt.js'

async function createUser (app: FastifyInstance, userData: Partial<{ username: string; password: string }>) {
  const [id] = await app.knex('users').insert(userData)
  return id
}

async function deleteUser (app: FastifyInstance, username: string) {
  await app.knex('users').delete().where({ username })
}

async function updatePasswordWithLoginInjection (app: FastifyInstance, username: string, payload: { currentPassword: string; newPassword: string }) {
  return await app.injectWithLogin(username, {
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

  it('Should update the password successfully', async () => {
    await createUser(app, { username: 'random-user-0', password: hash })
    const res = await updatePasswordWithLoginInjection(app, 'random-user-0', {
      currentPassword: 'Password123$',
      newPassword: 'NewPassword123$'
    })

    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Password updated successfully' })

    await deleteUser(app, 'random-user-0')
  })

  it('Should return 400 if the new password is the same as current password', async () => {
    await createUser(app, { username: 'random-user-1', password: hash })
    const res = await updatePasswordWithLoginInjection(app, 'random-user-1', {
      currentPassword: 'Password123$',
      newPassword: 'Password123$'
    })

    assert.strictEqual(res.statusCode, 400)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'New password cannot be the same as the current password.' })

    await deleteUser(app, 'random-user-1')
  })

  it('Should return 400 if the newPassword password not match the required pattern', async () => {
    await createUser(app, { username: 'random-user-2', password: hash })
    const res = await updatePasswordWithLoginInjection(app, 'random-user-2', {
      currentPassword: 'Password123$',
      newPassword: 'password123$'
    })

    assert.strictEqual(res.statusCode, 400)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'body/newPassword must match pattern "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$"' })

    await deleteUser(app, 'random-user-2')
  })

  it('Should return 401 the current password is incorrect', async () => {
    await createUser(app, { username: 'random-user-3', password: hash })
    const res = await updatePasswordWithLoginInjection(app, 'random-user-3', {
      currentPassword: 'WrongPassword123$',
      newPassword: 'Password123$'
    })

    assert.strictEqual(res.statusCode, 401)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Invalid current password.' })

    await deleteUser(app, 'random-user-3')
  })

  it('Should return 401 if user does not exist in the database', async () => {
    await createUser(app, { username: 'random-user-4', password: hash })
    const loginResponse = await app.injectWithLogin('random-user-4', {
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        username: 'random-user-4',
        password: 'Password123$'
      }
    })

    assert.strictEqual(loginResponse.statusCode, 200)

    await deleteUser(app, 'random-user-4')

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
    await deleteUser(app, 'random-user-4')
  })

  it('Should enforce rate limiting by returning a 429 status after exceeding 3 password update attempts within 1 minute', async () => {
    const updatePassword = async () => {
      return await updatePasswordWithLoginInjection(app, 'random-user-5', {
        currentPassword: 'WrongPassword123$',
        newPassword: 'Password123$'
      })
    }

    const performMultiplePasswordUpdates = async () => {
      for (let i = 0; i < 3; i++) {
        await updatePassword()
      }
    }

    await createUser(app, { username: 'random-user-5', password: hash })

    await performMultiplePasswordUpdates()

    const res = await updatePassword()

    assert.strictEqual(res.statusCode, 429)
    assert.equal(res.payload, '{"message":"Rate limit exceeded, retry in 1 minute"}')

    await deleteUser(app, 'random-user-5')
  })
})
