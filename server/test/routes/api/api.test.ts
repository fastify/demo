import { test } from 'node:test'
import assert from 'node:assert'
import { build } from '../../helper.js'

test('GET /api with no login', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/api'
  })

  assert.deepStrictEqual(JSON.parse(res.payload), {
    message: 'You must be authenticated to access this route.'
  })
})

test('GET /api with cookie', async (t) => {
  const app = await build(t)

  const res = await app.injectWithLogin('basic@example.com', {
    url: '/api'
  })

  assert.equal(res.statusCode, 200)
  assert.ok(JSON.parse(res.payload).message.startsWith('Hello basic!'))
})
