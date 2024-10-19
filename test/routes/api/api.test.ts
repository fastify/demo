import { test } from 'node:test'
import assert from 'node:assert'
import { build } from '../../helper.js'

test('GET /api without authorization header', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/api'
  })

  assert.equal(res.statusCode, 401)
  assert.deepStrictEqual(JSON.parse(res.payload).message, 'No Authorization was found in request.headers')
})

test('GET /api without JWT Token', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/api',
    headers: {
      Authorization: 'Bearer invalidtoken'
    }
  })

  assert.equal(res.statusCode, 401)
  assert.deepStrictEqual(JSON.parse(res.payload).message, 'Authorization token is invalid: The token is malformed.')
})

test('GET /api with JWT Token', async (t) => {
  const app = await build(t)

  const res = await app.injectWithLogin('basic', {
    url: '/api'
  })

  assert.equal(res.statusCode, 200)
  assert.ok(JSON.parse(res.payload).message.startsWith('Hello basic!'))
})
