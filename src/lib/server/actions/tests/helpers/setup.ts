import { beforeAll } from 'vitest';
import { seedFixture } from './fixture';

// Runs once per test file (vitest applies setupFiles per file). fileParallelism is off in
// vitest.config.integration.ts, so files run one after another and each reseeds the fixture
// from scratch before its own tests run.
beforeAll(async () => {
	await seedFixture();
});
