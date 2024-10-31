import { test } from 'node:test'
import assert from 'node:assert'
import { build } from '../../../helper.js'

test('Should return 401 if user does not exist in the database', async (t) => {
  // I should remove the user from the database ?
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

// test('Transaction should rollback on error', async (t) => {
//   const app = await build(t)
// const { mock: mockCompare } = t.mock.method(app, 'compare')
//
// mockCompare.mockImplementationOnce(() => {
//   return new Promise((resolve) => {
//     resolve(true)
//   })
// })

// const res = await app.injectWithLogin('basic', {
//   method: 'PUT',
//   url: '/api/user/update-password',
//   payload: {
//     currentPassword: 'Password123$',
//     newPassword: 'Xy9#Lm3$'
//   }
// })
// assert.strictEqual(res.statusCode, 200)
// await app.inject({
//   method: 'PUT',
//   url: '/api/user/update-password',
//   payload: {
//     newPassword: 'password123$',
//     currentPassword: 'password123$'
//   }
// })

// assert.strictEqual(mockCompare.callCount(), 1)

// const arg = mockLogError.calls[0].arguments[0] as unknown as {
//   err: Error
// }
// console.log('%c LOG arg.err.message', 'background: #222; color: #bada55', arg.err.message)
// assert.strictEqual(res.statusCode, 500)
// assert.deepStrictEqual(arg.err.message, 'An error occurred while updating the password.')
// })

// test('POST /api/auth/login with valid credentials', async (t) => {
//   const app = await build(t)
//
//   const res = await app.inject({
//     method: 'POST',
//     url: '/api/auth/login',
//     payload: {
//       username: 'basic',
//       password: 'password123$'
//     }
//   })
//
//   assert.strictEqual(res.statusCode, 200)
//   assert.ok(
//     res.cookies.some((cookie) => cookie.name === app.config.COOKIE_NAME)
//   )
// })
//
// test('POST /api/auth/login with invalid credentials', async (t) => {
//   const app = await build(t)
//
//   const testCases = [
//     {
//       username: 'invalid_user',
//       password: 'password',
//       description: 'invalid username'
//     },
//     {
//       username: 'basic',
//       password: 'wrong_password',
//       description: 'invalid password'
//     },
//     {
//       username: 'invalid_user',
//       password: 'wrong_password',
//       description: 'both invalid'
//     }
//   ]
//
//   for (const testCase of testCases) {
//     const res = await app.inject({
//       method: 'POST',
//       url: '/api/auth/login',
//       payload: {
//         username: testCase.username,
//         password: testCase.password
//       }
//     })
//
//     assert.strictEqual(
//       res.statusCode,
//       401,
//       `Failed for case: ${testCase.description}`
//     )
//
//     assert.deepStrictEqual(JSON.parse(res.payload), {
//       message: 'Invalid username or password.'
//     })
//   }
// })
