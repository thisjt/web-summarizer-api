import { OpenAPIHono } from '@hono/zod-openapi';
import { mountOpenApi } from './lib/openapi';
import auth from './lib/auth';
import { NOT_FOUND } from 'stoker/http-status-phrases';

import getalljobs from './routes/getalljobs';
import getjob from './routes/getjob';
import postjob from './routes/postjob';
import executejob from './routes/executejob';

const app = new OpenAPIHono();

app.route('/', auth);

const routes = [getalljobs, getjob, postjob, executejob];

routes.forEach((route) => app.route('/', route));

mountOpenApi(app);

app.all('*', (c) => {
	return c.json({ message: NOT_FOUND }, 404);
});

export default app;
