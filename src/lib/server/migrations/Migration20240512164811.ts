import { Migration } from '@mikro-orm/migrations';

export class Migration20240512164811 extends Migration {

  async up(): Promise<void> {
    this.addSql('create type "course_type" as enum (\'course\', \'sandbox\');');
    this.addSql('create type "user_role" as enum (\'user\', \'admin\');');
    this.addSql('create table "program" ("id" serial primary key, "name" varchar(255) not null, "description" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null);');

    this.addSql('create table "course" ("id" serial primary key, "code" varchar(255) not null, "name" varchar(255) not null, "description" varchar(255) null, "type" "course_type" not null default \'course\', "program_id" int not null, "created_at" timestamptz not null, "updated_at" timestamptz not null);');

    this.addSql('create table "user" ("id" serial primary key, "netid" varchar(255) not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "role" "user_role" not null default \'user\', "created_at" timestamptz not null, "email" varchar(255) null);');

    this.addSql('create table "program_coordinators" ("program_id" int not null, "user_id" int not null, constraint "program_coordinators_pkey" primary key ("program_id", "user_id"));');

    this.addSql('alter table "course" add constraint "course_program_id_foreign" foreign key ("program_id") references "program" ("id") on update cascade;');

    this.addSql('alter table "program_coordinators" add constraint "program_coordinators_program_id_foreign" foreign key ("program_id") references "program" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "program_coordinators" add constraint "program_coordinators_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;');
  }

}
