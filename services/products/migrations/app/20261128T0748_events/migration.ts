#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4f013e5638550d0af37a517a7bf088a83d6d2cf747c9f49761fce0a4d3a92e43/contract';
import startContract from '../../snapshots/4f013e5638550d0af37a517a7bf088a83d6d2cf747c9f49761fce0a4d3a92e43/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b9d2150714e43d73272e21811b5a48af1958afdec5c8f824669d86ba4171223e/contract';
import endContract from '../../snapshots/b9d2150714e43d73272e21811b5a48af1958afdec5c8f824669d86ba4171223e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'ProcessedEvent',
        columns: [
          col('eventId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('eventType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('processedAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['eventId'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ProcessedEvent',
        index: 'ProcessedEvent_eventType_idx_e4cf7742',
        columns: ['eventType'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
