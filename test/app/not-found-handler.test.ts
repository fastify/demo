import { it } from 'node:test'
import assert from 'node:assert'
import { build } from '../helper.js'

it('should call notFoundHandler', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/this-route-does-not-exist'
  })

  assert.strictEqual(res.statusCode, 404)
  assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Not Found' })
})

it('should be rate limited', async (t) => {
  const app = await build(t)

  for (let i = 0; i < 3; i++) {
    const res = await app.inject({
      method: 'GET',
      url: '/this-route-does-not-exist'
    })

    assert.strictEqual(res.statusCode, 404, `Iteration ${i}`)
  }

  const res = await app.inject({
    method: 'GET',
    url: '/this-route-does-not-exist'
  })

  assert.strictEqual(res.statusCode, 429, 'Expected 429')
})
