import { Client } from 'pg'

if (Number(process.env.CAN_CREATE_DATABASE) !== 1) {
  throw new Error("You can't create the database. Set `CAN_CREATE_DATABASE=1` environment variable to allow this operation.")
}

async function createDatabase () {
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
    await createDB(connection, databaseName)
    console.log(`Database ${databaseName} has been created successfully.`)
  } catch (error) {
    console.error('Error creating database:', error)
  } finally {
    await connection.end()
  }
}

async function createDB (connection: Client, databaseName: string) {
  const exists = await connection.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [databaseName]
  )

  if (exists.rowCount > 0) {
    console.log(`Database ${databaseName} already exists.`)
    return
  }

  const safeDbName = databaseName.replace(/"/g, '""')
  await connection.query(`CREATE DATABASE "${safeDbName}"`)
  console.log(`Database ${databaseName} created.`)
}

createDatabase()
