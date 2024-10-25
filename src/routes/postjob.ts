import { OpenAPIHono } from '@hono/zod-openapi';

const app = new OpenAPIHono();

const postjob = app.post('/job', (c) => {
	return c.text('Post Job!');
});

export default postjob;
