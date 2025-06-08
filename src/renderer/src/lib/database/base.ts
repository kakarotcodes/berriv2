/**
 * Base database interface for shared database operations
 */

export interface DatabaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface DatabaseOptions {
  tableName: string
  dbPath?: string
}

/**
 * Base database operations interface
 */
export interface BaseDatabase<T extends DatabaseEntity> {
  getAll(): T[]
  getById(id: string): T | null
  insert(entity: T): void
  update(id: string, fields: Partial<Omit<T, 'id'>>): void
  delete(id: string): void
}

/**
 * Common database utilities
 */

/**
 * Generate a new UUID
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Get current timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Validate entity before database operations
 */
export function validateEntity<T extends DatabaseEntity>(entity: T): boolean {
  return !!(entity.id && entity.createdAt && entity.updatedAt)
}

/**
 * Prepare entity for insertion (set timestamps)
 */
export function prepareForInsert<T extends Omit<DatabaseEntity, 'createdAt' | 'updatedAt'>>(
  entity: T
): T & DatabaseEntity {
  const now = getCurrentTimestamp()
  return {
    ...entity,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * Prepare entity for update (set updatedAt)
 */
export function prepareForUpdate<T extends Partial<DatabaseEntity>>(entity: T): T & { updatedAt: string } {
  return {
    ...entity,
    updatedAt: getCurrentTimestamp()
  }
} 