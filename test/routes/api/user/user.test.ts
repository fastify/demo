/* TODO
-  Refactor: Extract utility functions from the createUser ?
-  Update: Modify all test files to ensure passwords match the new password pattern.
-  Rename: Update test descriptions for clarity and consistency.
*/

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

describe('User API', () => {
  before(async () => {
    const app = await build()
    // Fill the password with the hashed value of `Password123$`
    const Password123$ = 'ff57faf149a2bcab41bf7ecbbc8ce491.3ce6b34ea3edb3f0a09f811440885bfeda612832c04bfddc9d4b906019d97fa0'

    await createUser(app, {
      username: 'random-user-0',
      password: Password123$
    })

    await createUser(app, {
      username: 'random-user-1',
      password: Password123$
    })

    await createUser(app, {
      username: 'random-user-2',
      password: Password123$
    })

    await createUser(app, {
      username: 'random-user-3',
      password: Password123$
    })

    await createUser(app, {
      username: 'random-user-4',
      password: Password123$
    })

    await createUser(app, {
      username: 'random-user-5',
      password: Password123$
    })

    await app.close()
  })

  it('Should update the password successfully', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('random-user-0', {
      method: 'PUT',
      url: '/api/user/update-password',
      payload: {
        currentPassword: 'Password123$',
        newPassword: 'NewPassword123$'
      }
    })

    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Password updated successfully' })

    await deleteUser(app, {
      username: 'random-user-0'
    })
  })

  it('Should return 400 if the new password is the same as current password', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('random-user-1', {
      method: 'PUT',
      url: '/api/user/update-password',
      payload: {
        currentPassword: 'Password123$',
        newPassword: 'Password123$'
      }
    })

    assert.strictEqual(res.statusCode, 400)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'New password cannot be the same as the current password.' })

    await deleteUser(app, {
      username: 'random-user-1'
    })
  })

  it('Should return 400 if the newPassword password not match the required pattern', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('random-user-2', {
      method: 'PUT',
      url: '/api/user/update-password',
      payload: {
        currentPassword: 'Password123$',
        newPassword: 'password123$'
      }
    })

    assert.strictEqual(res.statusCode, 400)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'body/newPassword must match pattern "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$"' })

    await deleteUser(app, {
      username: 'random-user-2'
    })
  })

  it('Should return 401 the current password is incorrect', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('random-user-3', {
      method: 'PUT',
      url: '/api/user/update-password',
      payload: {
        currentPassword: 'WrongPassword123$',
        newPassword: 'Password123$'
      }
    })

    assert.strictEqual(res.statusCode, 401)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Invalid current password.' })

    await deleteUser(app, {
      username: 'random-user-3'
    })
  })

  it('Should return 401 if user does not exist in the database', async (t) => {
    const app = await build(t)

    const loginResponse = await app.injectWithLogin('random-user-4', {
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        username: 'random-user-4',
        password: 'Password123$'
      }
    })

    assert.strictEqual(loginResponse.statusCode, 200)

    await deleteUser(app, {
      username: 'random-user-4'
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

  it('Should enforce rate limiting by returning a 429 status after exceeding 3 password update attempts within 1 minute', async (t) => {
    const app = await build(t)

    const updatePassword = async () => {
      return await app.injectWithLogin('random-user-5', {
        method: 'PUT',
        url: '/api/user/update-password',
        payload: {
          currentPassword: 'WrongPassword123$',
          newPassword: 'Password123$'
        }
      })
    }

    await updatePassword()
    await updatePassword()
    await updatePassword()
    const res = await updatePassword()

    assert.strictEqual(res.statusCode, 429)

    const regex = /You have reached the request limit. Please try again in (\d+) seconds./

    assert.ok(regex.test(res.payload))

    await deleteUser(app, {
      username: 'random-user-5'
    })
  })
})
