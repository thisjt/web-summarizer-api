import { D1Database, Fetcher } from '@cloudflare/workers-types';

export type Bindings = {
	TOKEN: string;
	DB: D1Database;
	BROWSER: Fetcher;
};
