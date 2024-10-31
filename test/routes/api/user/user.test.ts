import { test } from 'node:test'
import assert from 'node:assert'
import { build } from '../../../helper.js'

test('Should return 401 if user does not exist in the database', async (t) => {
  // I should remove the user from the database ?
})

test('Should update the password successfully', async (t) => {
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

test('Should return 400 if the new password is the same as current password', async (t) => {
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

test('Should return 400 if the newPassword password not match the required pattern', async (t) => {
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

test('Should return 401 the current password is incorrect', async (t) => {
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
