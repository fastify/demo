import { createConnection, Connection } from 'mysql2/promise'

if (Number(process.env.CAN_CREATE_DATABASE) !== 1) {
  throw new Error("You can't create the database. Set `CAN_CREATE_DATABASE=1` environment variable to allow this operation.")
}

async function createDatabase () {
  const connection = await createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD
  })

  try {
    await createDB(connection)
    console.log(`Database ${process.env.MYSQL_DATABASE} has been created successfully.`)
  } catch (error) {
    console.error('Error creating database:', error)
  } finally {
    await connection.end()
  }
}

async function createDB (connection: Connection) {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DATABASE}\``)
  console.log(`Database ${process.env.MYSQL_DATABASE} created or already exists.`)
}

createDatabase()
