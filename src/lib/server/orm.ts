import { MikroORM } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import config from './mikro-orm.config';

export default await MikroORM.init<PostgreSqlDriver>(config);