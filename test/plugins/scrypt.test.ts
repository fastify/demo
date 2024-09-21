import { test } from 'tap'
import Fastify from 'fastify'
import scryptPlugin from '../../src/plugins/custom/scrypt.js'

test('scrypt works standalone', async t => {
  const app = Fastify()

  t.teardown(() => app.close())

  app.register(scryptPlugin)

  await app.ready()

  const password = 'test_password'
  const hash = await app.hash(password)
  t.type(hash, 'string')

  const isValid = await app.compare(password, hash)
  t.ok(isValid, 'compare should return true for correct password')

  const isInvalid = await app.compare('wrong_password', hash)
  t.notOk(isInvalid, 'compare should return false for incorrect password')

  await t.rejects(
    () => app.compare(password, 'malformed_hash'),
    'compare should throw an error for malformed hash'
  )
})
