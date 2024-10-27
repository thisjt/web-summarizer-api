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

	const executeJob = new Summarizer({ url: '', id, bindings: c.env });
	if (!executeJob.options) return c.json({ message: StatusPhrases.INTERNAL_SERVER_ERROR }, StatusCodes.INTERNAL_SERVER_ERROR);

	const JobReadUpdate = new JobReadUpdateDependency(executeJob.options);
	executeJob.setJobRU(JobReadUpdate);
	const jobData = await executeJob.readJob({});
	if (!jobData.success) {
		executeJob.error('Unable to pull job details', jobData.error);
		throw Error('No bindings specified');
	}

	const StatusUpdate = new ChangeStatusDependency(executeJob.options);
	executeJob.setStatusChanger(StatusUpdate);
	const processingStatus = executeJob.setStatus('processing');
	const updatedJobStarted = executeJob.updateJob({ id, data: { started: new Date().getTime() } });

	const BrowserFetcher = new BrowserRendererDependency(executeJob.options);
	executeJob.setFetcher(BrowserFetcher);
	const fetchStep = await executeJob.fetch();
	if (!fetchStep.success) {
		executeJob.error('Unable to fetch html from url', executeJob.url);
		await Promise.all([processingStatus, updatedJobStarted]);
		executeJob.setStatus('failed', { message: 'Unable to fetch html from url', code: 4 });
		throw Error('Unable to fetch html from url');
	}

	const HTMLParser = new ParserDependency(executeJob.options);
	executeJob.setParser(HTMLParser);
	const parsedHtml = await executeJob.parse();
	if (!parsedHtml.success) {
		executeJob.error('Unable parse html from rawHtml', executeJob.url);
		await Promise.all([processingStatus, updatedJobStarted]);
		executeJob.setStatus('failed', { message: 'Unable parse html from rawHtml', code: 4 });
		throw Error('Unable parse html from rawHtml');
	}

	const LLMSummarizer = new SummarizeDependency(executeJob.options);
	executeJob.setSummarize(LLMSummarizer);

	const summarizedPage = await executeJob.summarize();
	if (!summarizedPage.success) {
		executeJob.error('Unable to get summary of parsed html', executeJob.url);
		await Promise.all([processingStatus, updatedJobStarted]);
		executeJob.setStatus('failed', { message: 'Unable parse html from rawHtml', code: 4 });
		throw Error('Unable parse html from rawHtml');
	}

	const updatedJob = await executeJob.updateJob({
		id,
		data: {
			summary: summarizedPage.data.output,
			finished: new Date().getTime(),
		},
	});

	if (!updatedJob.success) {
		executeJob.error('Failed to update job in database', executeJob.url);
		await Promise.all([processingStatus, updatedJobStarted]);
		executeJob.setStatus('failed', { message: 'Failed to update job in database', code: 4 });
		throw Error('Failed to update job in database');
	}

	await Promise.all([processingStatus]);
	executeJob.setStatus('completed');

	return c.json({ id: 1, url: '', status: '', summary: summarizedPage.data.output, timestamp: 1 }, StatusCodes.OK);
});

export default executejob;
