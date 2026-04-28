import knex from 'knex';
import { logger } from '../utils/logger';

let db: knex.Knex;

export async function initializeDatabase(): Promise<knex.Knex> {
  try {
    const environment = process.env.NODE_ENV || 'development';
    const config = require('../../knexfile')[environment];

    db = knex(config);

    // Test connection
    await db.raw('SELECT 1');

    logger.info('Database connection established');
    return db;
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
}

export function getDatabase(): knex.Knex {
  if (!db) {
    const environment = process.env.NODE_ENV || 'development';
    const config = require('../../knexfile')[environment];
    db = knex(config);
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    logger.info('Database connection closed');
  }
}
