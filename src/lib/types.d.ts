import { D1Database } from '@cloudflare/workers-types';

export type Bindings = {
	TOKEN: string;
	DB: D1Database;
};
