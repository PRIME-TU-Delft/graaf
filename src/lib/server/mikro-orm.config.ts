import 'dotenv/config';
import { type Options, PostgreSqlDriver, ReflectMetadataProvider } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Migrator } from '@mikro-orm/migrations';

const config: Options = {
	dbName: 'db',
	driver: PostgreSqlDriver,
	clientUrl: process.env.DATABASE_URL,
	metadataProvider: TsMorphMetadataProvider,

	entities: ['./src/lib/server/entities/**/*.js'],
	entitiesTs: ['./src/lib/server/entities/**/*.ts'],

	migrations: {
		emit: 'ts',
		path: './src/lib/server/migrations',
	},

	extensions: [Migrator],
	debug: true
};
export default config;
