import app from '../lib/app';
import { createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import { createErrorSchema } from 'stoker/openapi/schemas';
import { internalServerErrorSchema, notFoundSchema, unauthorizedSchema } from '../lib/constants';
import { TokenSchema } from '../lib/auth';
import { JobDetails } from '../lib/models';
import * as StatusCodes from 'stoker/http-status-codes';
import * as StatusPhrases from 'stoker/http-status-phrases';
import { IdSchema } from '../lib/models';

import { Summarizer } from '../lib/summarizer/0.constructor';
import { BrowserRendererDependency } from '../lib/summarizer/3.fetcher';
import { JobReadUpdateDependency } from '../lib/summarizer/1.job';
import { ChangeStatusDependency } from '../lib/summarizer/2.status';
import { ParserDependency } from '../lib/summarizer/4.parser';
import { SummarizeDependency } from '../lib/summarizer/5.summarizer';

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

	const promisesToWait: Promise<unknown>[] = [];

	const executeJob = new Summarizer({ url: '', id, bindings: c.env });
	if (!executeJob.options) return c.json({ message: StatusPhrases.INTERNAL_SERVER_ERROR }, StatusCodes.INTERNAL_SERVER_ERROR);

	const JobReadUpdate = new JobReadUpdateDependency(executeJob.options);
	executeJob.setJobRU(JobReadUpdate);
	const jobData = await executeJob.readJob({});
	if (!jobData.success)
		return await executeJob.failStep({ message: 'Failed to open jobs database', code: 6 }, [], [], async (error) =>
			c.json({ message: error.message }, StatusCodes.INTERNAL_SERVER_ERROR),
		);
	if (!jobData.data) return await executeJob.failStep({ message: 'Job not found', code: 5 }, [], [], async (error) => c.json({ message: error.message }, StatusCodes.NOT_FOUND));

	executeJob.options.id = jobData.data.id;

	const StatusUpdate = new ChangeStatusDependency(executeJob.options);
	executeJob.setStatusChanger(StatusUpdate);
	promisesToWait.push(executeJob.setStatus('processing'));
	promisesToWait.push(executeJob.updateJob({ id, data: { started: new Date().getTime() } }));

	const BrowserFetcher = new BrowserRendererDependency(executeJob.options);
	executeJob.setFetcher(BrowserFetcher);
	const fetchStep = await executeJob.fetch();
	if (!fetchStep.success)
		return await executeJob.failStep({ message: 'Unable to fetch rawHTML from URL', code: 7 }, [executeJob.url], promisesToWait, async (error) =>
			c.json({ message: error.message }, StatusCodes.INTERNAL_SERVER_ERROR),
		);

	const HTMLParser = new ParserDependency(executeJob.options);
	executeJob.setParser(HTMLParser);
	const parsedHtml = await executeJob.parse();
	if (!parsedHtml.success)
		return await executeJob.failStep({ message: 'Unable to parseHTML from rawHTML', code: 8 }, [executeJob.url], promisesToWait, async (error) =>
			c.json({ message: error.message }, StatusCodes.INTERNAL_SERVER_ERROR),
		);

	const LLMSummarizer = new SummarizeDependency(executeJob.options);
	executeJob.setSummarize(LLMSummarizer);

	const summarizedPage = await executeJob.summarize();
	if (!summarizedPage.success)
		return await executeJob.failStep({ message: 'Unable to get summary from LLM from parseHTML', code: 9 }, [executeJob.url], promisesToWait, async (error) =>
			c.json({ message: error.message }, StatusCodes.INTERNAL_SERVER_ERROR),
		);

	const updatedJob = await executeJob.updateJob({
		id,
		data: {
			summary: executeJob.summary,
			finished: new Date().getTime(),
		},
	});

	if (!updatedJob.success)
		return await executeJob.failStep({ message: 'Unable to update job in database', code: 10 }, [executeJob.url, id], promisesToWait, async (error) =>
			c.json({ message: error.message }, StatusCodes.INTERNAL_SERVER_ERROR),
		);

	await Promise.all(promisesToWait);
	const status = await executeJob.setStatus('completed');

	return c.json({ ...updatedJob.data, ...{ status: status.data?.output || 'completed' } }, StatusCodes.OK);
});

export default executejob;
