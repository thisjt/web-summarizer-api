import { OpenAPIHono } from '@hono/zod-openapi';
import getjob from './routes/getjob';
import postjob from './routes/postjob';
import { mountOpenApi } from './lib/openapi';
import auth from './lib/auth';

const app = new OpenAPIHono();

app.route('/', auth);

const routes = [getjob, postjob];

routes.forEach((route) => app.route('/', route));

mountOpenApi(app);

export default app;
