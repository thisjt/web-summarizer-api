import app from '../lib/app';
import { z, createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import { createErrorSchema } from 'stoker/openapi/schemas';
import { internalServerErrorSchema, notFoundSchema, unauthorizedSchema } from '../lib/constants';
import { TokenSchema } from '../lib/auth';
import { JobDetails } from '../lib/models';
import * as StatusCodes from 'stoker/http-status-codes';
import * as StatusPhrases from 'stoker/http-status-phrases';
import prisma from '../lib/prisma';

const IdSchema = z.object({
	id: z.coerce.number({ message: 'Invalid job id' }).openapi({
		title: 'Job ID',
		description: 'Specify this parameter to grab the details of your Job ID.',
		type: 'number',
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

	let result;
	try {
		result = await prisma(c.env.DB).jobs.findUnique({
			select: {
				id: true,
				url: true,
				status: true,
				summary: true,
				summary_logs: true,
				summary_error_message: true,
				timestamp: true,
				started: true,
				finished: true,
			},
			where: {
				id,
			},
		});
	} catch (e) {
		console.error(e);
		return c.json({ message: StatusPhrases.INTERNAL_SERVER_ERROR }, StatusCodes.INTERNAL_SERVER_ERROR);
	}

	if (!result) return c.json({ message: StatusPhrases.NOT_FOUND }, StatusCodes.NOT_FOUND);

	const zodded = JobDetails.safeParse(result);
	if (!zodded.data) {
		console.error('Failed Zod Values from database:', result, zodded.error);
		return c.json({ message: StatusPhrases.INTERNAL_SERVER_ERROR }, StatusCodes.INTERNAL_SERVER_ERROR);
	}

	return c.json(zodded.data, StatusCodes.OK);
});

export default getjob;
