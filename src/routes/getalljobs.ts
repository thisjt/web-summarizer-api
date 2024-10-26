import app from '../lib/app';
import { createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import { internalServerErrorSchema, unauthorizedSchema } from '../lib/constants';
import { TokenSchema } from '../lib/auth';
import { MultipleJobDetails } from '../lib/models';
import * as StatusCodes from 'stoker/http-status-codes';
import * as StatusPhrases from 'stoker/http-status-phrases';
import prisma from '../lib/prisma';

const route = createRoute({
	method: 'get',
	path: '/jobs',
	description: 'Gets all job status and details.',
	request: {
		query: TokenSchema,
	},
	responses: {
		[StatusCodes.OK]: jsonContent(MultipleJobDetails, 'Job Retrieved'),
		[StatusCodes.UNAUTHORIZED]: jsonContent(unauthorizedSchema, 'Unauthorized'),
		[StatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(internalServerErrorSchema, 'Internal Server Error'),
	},
});

const getalljobs = app.openapi(route, async (c) => {
	let result;
	try {
		result = await prisma(c.env.DB).jobs.findMany({
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
		});
	} catch (e) {
		console.error(e);
		return c.json({ message: StatusPhrases.INTERNAL_SERVER_ERROR }, StatusCodes.INTERNAL_SERVER_ERROR);
	}

	const zodded = MultipleJobDetails.safeParse(result);
	if (!zodded.data) {
		console.error('Failed Zod Values from database:', result, zodded.error);
		return c.json({ message: StatusPhrases.INTERNAL_SERVER_ERROR }, StatusCodes.INTERNAL_SERVER_ERROR);
	}

	return c.json(zodded.data, StatusCodes.OK);
});

export default getalljobs;
