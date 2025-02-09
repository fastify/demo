import { createConnection, Connection } from 'mysql2/promise'

if (Number(process.env.CAN_DROP_DATABASE) !== 1) {
  throw new Error("You can't drop the database. Set `CAN_DROP_DATABASE=1` environment variable to allow this operation.")
}

async function dropDatabase () {
  const connection = await createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD
  })

  try {
    await dropDB(connection)
    console.log(`Database ${process.env.MYSQL_DATABASE} has been dropped successfully.`)
  } catch (error) {
    console.error('Error dropping database:', error)
  } finally {
    await connection.end()
  }
}

async function dropDB (connection: Connection) {
  await connection.query(`DROP DATABASE IF EXISTS \`${process.env.MYSQL_DATABASE}\``)
  console.log(`Database ${process.env.MYSQL_DATABASE} dropped.`)
}

dropDatabase()
