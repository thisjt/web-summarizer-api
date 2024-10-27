import { BrowserWorker } from '@cloudflare/puppeteer';
import { Ai, D1Database } from '@cloudflare/workers-types';

export type Bindings = {
	TOKEN: string;
	AITOKEN: string;
	DB: D1Database;
	BROWSER: BrowserWorker;
	AI: Ai;
};
