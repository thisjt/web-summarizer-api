import app from '../lib/app';
import { createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import { createErrorSchema } from 'stoker/openapi/schemas';
import { internalServerErrorSchema, notFoundSchema, unauthorizedSchema } from '../lib/constants';
import { TokenSchema } from '../lib/auth';
import { JobDetails } from '../lib/models';
import * as StatusCodes from 'stoker/http-status-codes';
import * as StatusPhrases from 'stoker/http-status-phrases';
import prisma from '../lib/prisma';
import { IdSchema } from '../lib/models';

const route = createRoute({
	method: 'get',
	path: '/execute/{id}',
	description: 'Executes the specified job. If id is 0, the worker will pick the oldest job and executes it.',
	request: {
		params: IdSchema,
		query: TokenSchema,
	},
	responses: {
		[StatusCodes.OK]: jsonContent(JobDetails, 'Job Done'),
		[StatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Job ID not found'),
		[StatusCodes.UNAUTHORIZED]: jsonContent(unauthorizedSchema, 'Unauthorized'),
		[StatusCodes.BAD_REQUEST]: jsonContent(createErrorSchema(IdSchema), 'Error'),
		[StatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(internalServerErrorSchema, 'Internal Server Error'),
	},
});

const executejob = app.openapi(route, async (c) => {
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

export default executejob;
