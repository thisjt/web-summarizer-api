import { OpenAPIHono } from '@hono/zod-openapi';

const app = new OpenAPIHono();

const getjob = app.get('/job', (c) => {
	return c.text('Get Job!');
});

export default getjob;
