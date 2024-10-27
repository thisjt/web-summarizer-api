import app from '../lib/app';
import { createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import * as StatusCodes from 'stoker/http-status-codes';
import { createErrorSchema } from 'stoker/openapi/schemas';
import { internalServerErrorSchema, unauthorizedSchema } from '../lib/constants';
import { JobCreate, JobDetails } from '../lib/models';
import { TokenSchema } from '../lib/auth';
import prisma from '../lib/prisma';
import { INTERNAL_SERVER_ERROR } from 'stoker/http-status-phrases';

const route = createRoute({
	method: 'post',
	path: '/jobs',
	description: 'Creates a web summarizing job using the specified url. Returns the newly created job. You may use the id of this job to GET job status and details.',
	request: {
		body: jsonContent(JobCreate, 'Create a Job'),
		query: TokenSchema,
	},
	responses: {
		[StatusCodes.OK]: jsonContent(JobDetails, 'Job created from given url. Use the route /job/{id} to get job status'),
		[StatusCodes.UNAUTHORIZED]: jsonContent(unauthorizedSchema, 'Unauthorized'),
		[StatusCodes.BAD_REQUEST]: jsonContent(createErrorSchema(JobCreate), 'Error'),
		[StatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(internalServerErrorSchema, 'Internal Server Error'),
	},
});

const postjob = app.openapi(route, async (c) => {
	const { url } = c.req.valid('json');

	const timestamp = new Date().getTime();

	let result;
	try {
		result = await prisma(c.env.DB).jobs.create({
			data: {
				url,
				status: 'queue',
				timestamp,
			},
			select: {
				id: true,
				url: true,
				status: true,
				timestamp: true,
			},
		});
	} catch (e) {
		console.error(e);
		return c.json({ message: INTERNAL_SERVER_ERROR + '_05' }, 500);
	}

	return c.json({ ...result, ...{ timestamp } }, StatusCodes.OK);
});

export default postjob;
