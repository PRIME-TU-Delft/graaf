import { Migrator } from '@mikro-orm/migrations';
import { PostgreSqlDriver, type Options } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import 'dotenv/config';

import { Course } from './entities/Course.ts';
import { Program } from './entities/Program.ts';
import { User } from './entities/User.ts';

const config: Options = {
	dbName: 'db',
	driver: PostgreSqlDriver,
	clientUrl: process.env.DATABASE_URL,

	entities: [Course, Program, User],

	metadataProvider: TsMorphMetadataProvider,

	migrations: {
		emit: 'ts',
		path: './src/lib/server/migrations'
	},

	extensions: [Migrator],
	debug: true
};
export default config;
