import { OpenAPIHono } from '@hono/zod-openapi';
import { mountOpenApi } from './lib/openapi';
import auth from './lib/auth';
import { NOT_FOUND } from 'stoker/http-status-phrases';

import getalljobs from './routes/getalljobs';
import getjob from './routes/getjob';
import postjob from './routes/postjob';
import executejob from './routes/executejob';
import { ExecutionContext, ScheduledController } from '@cloudflare/workers-types';
import { Bindings } from './lib/types';

const app = new OpenAPIHono();

app.route('/', auth);

const routes = [getalljobs, getjob, postjob, executejob];

routes.forEach((route) => app.route('/', route));

mountOpenApi(app);

app.all('*', (c) => {
	return c.json({ message: NOT_FOUND + '_01' }, 404);
});

export default {
	fetch: app.fetch,
	async scheduled(controller: ScheduledController, env: Bindings, ctx: ExecutionContext) {
		ctx.waitUntil(
			new Promise(async (c) => {
				await app.request(`/execute/0?token=${env.TOKEN}`, { method: 'GET' }, env);
				c(null);
			}),
		);
	},
};
