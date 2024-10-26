import { OpenAPIHono } from '@hono/zod-openapi';
import getjob from './routes/getjob';
import postjob from './routes/postjob';
import { mountOpenApi } from './lib/openapi';

const app = new OpenAPIHono();

const routes = [getjob, postjob];

routes.forEach((route) => app.route('/', route));

app.get('/', (c) => {
	return c.redirect('/documentation', 302);
});

mountOpenApi(app);

export default app;
