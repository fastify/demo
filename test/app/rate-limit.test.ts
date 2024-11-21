import { it } from 'node:test'
import { build } from '../helper.js'
import assert from 'node:assert'

it('should be rate limited', async (t) => {
  const app = await build(t)

  for (let i = 0; i < 4; i++) {
    const res = await app.inject({
      method: 'GET',
      url: '/'
    })

    assert.strictEqual(res.statusCode, 200)
  }

  const res = await app.inject({
    method: 'GET',
    url: '/'
  })

  assert.strictEqual(res.statusCode, 429)
})
