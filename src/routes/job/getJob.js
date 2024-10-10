import { app } from '$lib/express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import emit from '$lib/emit';
import prisma from '$lib/prisma';

const jobId = z.object({
	id: z.coerce.number({ message: 'Invalid Job ID. Expecting a number.' }),
});

export default function getJob() {
	app.get('/job/:id?', async (request, response) => {
		const parseResult = jobId.safeParse({ id: request.params.id });

		if (parseResult.error) {
			response.status(StatusCodes.BAD_REQUEST).json(emit({ zodErrors: parseResult }));
			return;
		}

		let result;
		try {
			result = await prisma.jobs.findUnique({
				select: {
					id: true,
					url: true,
					status: true,
					summary: true,
					summary_error: true,
					summary_error_message: true,
					timestamp: true,
				},
				where: {
					id: parseResult.data.id,
				},
			});
		} catch (e) {
			response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(emit({ errors: { db: ['Database error.'] }, debug: e }));
			return;
		}

		if (!result) {
			response.status(StatusCodes.NOT_FOUND).json(emit({ errors: { job: ['Job not found.'] } }));
			return;
		}

		response.json(emit({ ...result, timestamp: Number(result.timestamp) }));
	});
}
