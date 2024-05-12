import { Migration } from '@mikro-orm/migrations';

export class Migration20240504161845_program_coordinators_relation extends Migration {
	async up(): Promise<void> {
		this.addSql(
			'create table "program_coordinators" ("program_id" varchar(255) not null, "user_id" varchar(255) not null, constraint "program_coordinators_pkey" primary key ("program_id", "user_id"));'
		);

		this.addSql(
			'alter table "program_coordinators" add constraint "program_coordinators_program_id_foreign" foreign key ("program_id") references "program" ("id") on update cascade on delete cascade;'
		);
		this.addSql(
			'alter table "program_coordinators" add constraint "program_coordinators_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;'
		);

		this.addSql('drop table if exists "user_programs" cascade;');

		this.addSql('alter table "user" add column "middle_name" varchar(255) null;');
	}

	async down(): Promise<void> {
		this.addSql(
			'create table "user_programs" ("user_id" varchar(255) not null, "program_id" varchar(255) not null, constraint "user_programs_pkey" primary key ("user_id", "program_id"));'
		);

		this.addSql(
			'alter table "user_programs" add constraint "user_programs_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;'
		);
		this.addSql(
			'alter table "user_programs" add constraint "user_programs_program_id_foreign" foreign key ("program_id") references "program" ("id") on update cascade on delete cascade;'
		);

		this.addSql('drop table if exists "program_coordinators" cascade;');

		this.addSql('alter table "user" drop column "middle_name";');
	}
}
