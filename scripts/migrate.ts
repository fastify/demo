import { Client, QueryResult } from 'pg'
import path from 'node:path'
import fs from 'node:fs'
import Postgrator from 'postgrator'

type PostgratorResult = QueryResult

async function doMigration (): Promise<void> {
  const connection = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
  })

  try {
    await connection.connect()
    const migrationDir = path.join(import.meta.dirname, '../migrations')

    if (!fs.existsSync(migrationDir)) {
      throw new Error(
        `Migration directory "${migrationDir}" does not exist. Skipping migrations.`
      )
    }

    const postgrator = new Postgrator({
      migrationPattern: path.join(migrationDir, '*'),
      driver: 'pg',
      database: process.env.POSTGRES_DATABASE,
      execQuery: async (query: string): Promise<PostgratorResult> => {
        return await connection.query(query)
      },
      schemaTable: 'schemaversion'
    })

    await postgrator.migrate()

    console.log('Migration completed!')
  } catch (err) {
    console.error(err)
  } finally {
    await connection.end().catch(err => console.error(err))
  }
}

doMigration()
