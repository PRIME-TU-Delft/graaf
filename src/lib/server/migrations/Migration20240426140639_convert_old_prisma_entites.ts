import { Migration } from '@mikro-orm/migrations';

export class Migration20240426140639_convert_old_prisma_entites extends Migration {

  async up(): Promise<void> {
    this.addSql('create type "course_type" as enum (\'course\', \'sandbox\');');
    this.addSql('create type "user_role" as enum (\'user\', \'admin\');');
    this.addSql('create table "program" ("id" varchar(255) not null, "name" varchar(255) not null, "description" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "program_pkey" primary key ("id"));');

    this.addSql('create table "course" ("id" varchar(255) not null, "code" varchar(255) not null, "name" varchar(255) not null, "description" varchar(255) null, "type" "course_type" not null default \'course\', "program_id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "course_pkey" primary key ("id"));');

    this.addSql('create table "user_programs" ("user_id" varchar(255) not null, "program_id" varchar(255) not null, constraint "user_programs_pkey" primary key ("user_id", "program_id"));');

    this.addSql('alter table "course" add constraint "course_program_id_foreign" foreign key ("program_id") references "program" ("id") on update cascade;');

    this.addSql('alter table "user_programs" add constraint "user_programs_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "user_programs" add constraint "user_programs_program_id_foreign" foreign key ("program_id") references "program" ("id") on update cascade on delete cascade;');

    this.addSql('alter table "user" drop column "username", drop column "name";');

    this.addSql('alter table "user" add column "netid" varchar(255) not null, add column "first_name" varchar(255) not null, add column "last_name" varchar(255) not null, add column "role" "user_role" not null default \'user\', add column "created_at" timestamptz not null, add column "email" varchar(255) null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "course" drop constraint "course_program_id_foreign";');

    this.addSql('alter table "user_programs" drop constraint "user_programs_program_id_foreign";');

    this.addSql('drop table if exists "program" cascade;');

    this.addSql('drop table if exists "course" cascade;');

    this.addSql('drop table if exists "user_programs" cascade;');

    this.addSql('alter table "user" drop column "netid", drop column "first_name", drop column "last_name", drop column "role", drop column "created_at", drop column "email";');

    this.addSql('alter table "user" add column "username" varchar(255) not null, add column "name" varchar(255) not null;');

    this.addSql('drop type "course_type";');
    this.addSql('drop type "user_role";');
  }

}
