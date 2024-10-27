import { BrowserWorker } from '@cloudflare/puppeteer';
import { D1Database } from '@cloudflare/workers-types';

export type Bindings = {
	TOKEN: string;
	DB: D1Database;
	BROWSER: BrowserWorker;
};
