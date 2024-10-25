import { OpenAPIHono } from '@hono/zod-openapi';

const app = new OpenAPIHono();

app.get('/', (c) => {
	return c.text('Hello stuff!');
});

export default app;
