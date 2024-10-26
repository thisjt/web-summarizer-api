import app from '../lib/app';
import { z, createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import * as StatusCodes from 'stoker/http-status-codes';
import { createErrorSchema } from 'stoker/openapi/schemas';
import { internalServerErrorSchema, notFoundSchema, unauthorizedSchema } from '../lib/constants';
import { TokenSchema } from '../lib/auth';
import { JobDetails } from '../lib/models';

const IdSchema = z.object({
	id: z.coerce.number({ message: 'Invalid job id' }).openapi({
		title: 'Job ID',
		description: 'Specify this parameter to grab the details of your Job ID.',
		type: 'number',
		format: '#',
		example: 68,
	}),
});

const route = createRoute({
	method: 'get',
	path: '/job/{id}',
	request: {
		params: IdSchema,
		query: TokenSchema,
	},
	responses: {
		[StatusCodes.OK]: jsonContent(JobDetails, 'Job Retrieved'),
		[StatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Job ID not found'),
		[StatusCodes.UNAUTHORIZED]: jsonContent(unauthorizedSchema, 'Unauthorized'),
		[StatusCodes.BAD_REQUEST]: jsonContent(createErrorSchema(IdSchema), 'Error'),
		[StatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(internalServerErrorSchema, 'Internal Server Error'),
	},
});

const getjob = app.openapi(route, async (c) => {
	const { id } = c.req.valid('param');

	return c.json(
		{
			id,
			url: 'https:// - ',
			status: 'asd',
			timestamp: 123123,
		},
		StatusCodes.OK,
	);
});

export default getjob;
