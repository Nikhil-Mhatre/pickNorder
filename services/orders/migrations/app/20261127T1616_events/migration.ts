#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/6d0d9ac50ff3d474c46429c35779efce1177ae7d71a0c19c8a3b8a663336df8a/contract';
import endContract from '../../snapshots/6d0d9ac50ff3d474c46429c35779efce1177ae7d71a0c19c8a3b8a663336df8a/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/daaeb8f5b2a4509bea167582b776efc309cc334ff66468f5587dd1d6c1cddf52/contract';
import startContract from '../../snapshots/daaeb8f5b2a4509bea167582b776efc309cc334ff66468f5587dd1d6c1cddf52/contract.json' with { type: 'json' };
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
