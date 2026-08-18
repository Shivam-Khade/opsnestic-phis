import { db } from '@/lib/db';
import { sql } from 'kysely';
import type { CompanyDomain, NewCompanyDomain } from '@/lib/db/types';

export async function getCompanyDomains() {
  return db
    .selectFrom('company_domains')
    .selectAll()
    .orderBy('created_at', 'desc')
    .execute();
}

export async function getCompanyDomainById(id: number) {
  return db
    .selectFrom('company_domains')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
}

export async function createCompanyDomain(domain: NewCompanyDomain) {
  const result = await db
    .insertInto('company_domains')
    .values(domain)
    .executeTakeFirst();
  return Number(result.insertId);
}

export async function updateCompanyDomain(id: number, updates: Partial<NewCompanyDomain>) {
  await db
    .updateTable('company_domains')
    .set(updates)
    .where('id', '=', id)
    .execute();
}

export async function deleteCompanyDomain(id: number) {
  await db
    .deleteFrom('company_domains')
    .where('id', '=', id)
    .execute();
}

export async function getRandomActiveCompanyDomain(): Promise<CompanyDomain | null> {
  const domain = await db
    .selectFrom('company_domains')
    .selectAll()
    .where('is_active', '=', 1)
    .orderBy(sql`RAND()`)
    .limit(1)
    .executeTakeFirst();
  
  return domain ?? null;
}
