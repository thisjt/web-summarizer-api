import app from '../lib/app';
import { z, createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import * as StatusCodes from 'stoker/http-status-codes';
import { createErrorSchema } from 'stoker/openapi/schemas';
import { unauthorizedSchema } from '../lib/constants';
import { JobCreate, JobDetails } from '../lib/models';
import { TokenSchema } from '../lib/auth';

const route = createRoute({
	method: 'post',
	path: '/job',
	request: {
		body: jsonContent(JobCreate, 'Create a Job'),
		query: TokenSchema,
	},
	responses: {
		[StatusCodes.OK]: jsonContent(JobDetails, 'Job created from given url. Use the route /job/{id} to get job status'),
		[StatusCodes.UNAUTHORIZED]: jsonContent(unauthorizedSchema, 'Unauthorized'),
		[StatusCodes.BAD_REQUEST]: jsonContent(createErrorSchema(JobCreate), 'Error'),
	},
});

const getjob = app.openapi(route, async (c) => {
	return c.json(
		{
			id: 3,
			url: 'https:// - ',
			status: 'asd',
			timestamp: 123123,
		},
		StatusCodes.OK,
	);
});

export default getjob;
