import 'dotenv/config';
import { type Options, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';

const config: Options = {
	dbName: 'db',
	driver: PostgreSqlDriver,
	clientUrl: process.env.DATABASE_URL,

	entitiesTs: ['./src/lib/server/entities'],

	migrations: {
		emit: 'ts',
		path: './src/lib/server/migrations',
	},

	discovery: {
		warnWhenNoEntities: false
	},

	extensions: [Migrator]
};
export default config;
