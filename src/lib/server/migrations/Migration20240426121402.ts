import { Migration } from '@mikro-orm/migrations';

export class Migration20240426121402 extends Migration {
	async up(): Promise<void> {
		this.addSql(
			'create table "user" ("id" varchar(255) not null, "username" varchar(255) not null, "name" varchar(255) not null, constraint "user_pkey" primary key ("id"));'
		);
	}

	async down(): Promise<void> {
		this.addSql('drop table if exists "user" cascade;');
	}
}
