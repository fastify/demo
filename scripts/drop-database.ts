import { Client } from 'pg'

if (Number(process.env.CAN_DROP_DATABASE) !== 1) {
  throw new Error("You can't drop the database. Set `CAN_DROP_DATABASE=1` environment variable to allow this operation.")
}

async function dropDatabase () {
  const databaseName = process.env.POSTGRES_DATABASE
  if (!databaseName) {
    throw new Error('Missing `POSTGRES_DATABASE` environment variable.')
  }

  const connection = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: 'postgres'
  })

  try {
    await connection.connect()
    await dropDB(connection, databaseName)
    console.log(`Database ${databaseName} has been dropped successfully.`)
  } catch (error) {
    console.error('Error dropping database:', error)
  } finally {
    await connection.end()
  }
}

async function dropDB (connection: Client, databaseName: string) {
  await connection.query(
    'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
    [databaseName]
  )

  const safeDbName = databaseName.replace(/"/g, '""')
  await connection.query(`DROP DATABASE IF EXISTS "${safeDbName}"`)
  console.log(`Database ${databaseName} dropped.`)
}

dropDatabase()
