import { it } from 'node:test'
import assert from 'node:assert'
import fastify from 'fastify'
import serviceApp from '../../src/app.js'
import fp from 'fastify-plugin'

it('should call errorHandler', async (t) => {
  const app = fastify()
  await app.register(fp(serviceApp))

  app.get('/error', () => {
    throw new Error('Kaboom!')
  })

  await app.ready()

  t.after(() => app.close())

  const res = await app.inject({
    method: 'GET',
    url: '/error'
  })

  assert.deepStrictEqual(JSON.parse(res.payload), {
    message: 'Internal Server Error'
  })
})
