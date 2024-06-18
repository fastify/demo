import mysql from 'mysql2/promise'
import path from 'path'
import Postgrator from 'postgrator'

async function doMigration () {
  const connection = await mysql.createConnection({
    multipleStatements: true,
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD
  })

  const postgrator = new Postgrator({
    migrationPattern: path.join(import.meta.dirname, '../migrations', '*'),
    driver: 'mysql',
    database: process.env.MYSQL_DATABASE,
    execQuery: async (query) => {
      const [rows, fields] = await connection.query(query)

      return { rows, fields }
    },
    schemaTable: 'schemaversion'
  })

  await postgrator.migrate()

  await new Promise((resolve, reject) => {
    connection.end((err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

doMigration().catch(err => console.error(err))
