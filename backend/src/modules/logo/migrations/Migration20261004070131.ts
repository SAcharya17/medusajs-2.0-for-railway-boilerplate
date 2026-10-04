import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261004070131 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "logo" ("id" text not null, "name" text not null, "url" text not null, "alt_text" text null, "type" text not null default 'primary', "is_active" boolean not null default true, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "logo_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_logo_deleted_at" ON "logo" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "logo" cascade;`);
  }

}
