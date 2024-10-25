import app from '../lib/app';
import { z, createRoute } from '@hono/zod-openapi';

const getjob = app.get('/job/{id}', (c) => {
	return c.text('Get Job!');
});

export default getjob;

/*
select: {
	id: true,
	url: true,
	status: true,
	summary: true,
	summary_error_message: true,
	timestamp: true,
},
*/
