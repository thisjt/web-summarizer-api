import emit from '$lib/emit';
import { app } from '$lib/express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import prisma from '$lib/prisma';

const jobPost = z.object({
	url: z.string({ message: 'URL is missing. Expecting { url : "http(s)://..." }.' }).url({ message: 'URL is invalid. Expecting "http(s)://...".' }),
});

export default function postJob() {
	app.post('/job', async (request, response) => {
		const parseResult = jobPost.safeParse(request.body);

		if (parseResult.error) {
			response.status(StatusCodes.BAD_REQUEST).json(emit({ zodErrors: parseResult }));
			return;
		}

		const timestamp = new Date().getTime();

		let result;
		try {
			result = await prisma.jobs.create({
				data: {
					url: parseResult.data.url,
					status: 'queue',
					timestamp,
				},
				select: {
					id: true,
				},
			});
		} catch (e) {
			response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(emit({ errors: { db: ['Database error.'] }, debug: e }));
			return;
		}

		if (!result.id) {
			response.status(StatusCodes.SERVICE_UNAVAILABLE).json(emit({ errors: { db: ['Unable to create job.'] } }));
			return;
		}

		response.json(emit({ id: result.id, url: parseResult.data.url, status: 'queue', timestamp }));
	});
}
