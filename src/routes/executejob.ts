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
import puppeteer from '@cloudflare/puppeteer';

const SHORT_PARAGRAPH = 100; //characters

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

	const dbselect = {
		id: true,
		url: true,
		status: true,
		summary: true,
		summary_logs: true,
		summary_error_message: true,
		timestamp: true,
		started: true,
		finished: true,
	};

	let result;
	try {
		if (id) {
			result = await prisma(c.env.DB).jobs.findFirst({
				select: dbselect,
				where: { id },
			});
		} else {
			result = await prisma(c.env.DB).jobs.findFirst({
				select: dbselect,
				where: { status: 'queue' },
			});
		}
	} catch (e) {
		console.error(e);
		return c.json({ message: StatusPhrases.INTERNAL_SERVER_ERROR }, StatusCodes.INTERNAL_SERVER_ERROR);
	}

	if (!result) return c.json({ message: StatusPhrases.NOT_FOUND }, StatusCodes.NOT_FOUND);

	const ParsedJobDetails = JobDetails.safeParse(result);
	if (!ParsedJobDetails.data) {
		console.error('Failed Zod Values from database:', result, ParsedJobDetails.error);
		return c.json({ message: StatusPhrases.INTERNAL_SERVER_ERROR }, StatusCodes.INTERNAL_SERVER_ERROR);
	}

	// Step 1. Set Status
	try {
		// await prisma(c.env.DB).jobs.update({
		// 	data: {
		// 		status: 'processing',
		// 		started: new Date().getTime(),
		// 	},
		// 	where: { id: result.id },
		// });
	} catch (e) {
		console.error(e);
		return c.json({ message: StatusPhrases.INTERNAL_SERVER_ERROR }, StatusCodes.INTERNAL_SERVER_ERROR);
	}

	// Step 2. Load URL to Puppeteer
	let htmlString = '';
	try {
		const browser = await puppeteer.launch(c.env.BROWSER);
		const page = await browser.newPage();
		await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15');
		await page.goto(result.url, { waitUntil: 'load', timeout: 15000 });
		const bodyHandle = await page.$('body');
		const html = await page.evaluate((body) => {
			let pData = '';
			/**
			 * Grabbing text inside the <p> tags are better than trying to filter out
			 * unwanted elements. This is a design choice, but it can be better. We do lose
			 * a bit of potentially useful data for summarization though.
			 */
			[...(body?.querySelectorAll('p') || [])].forEach((p) => {
				pData += p.textContent + ' ';
			});
			return pData;
		}, bodyHandle);
		htmlString = html.replace(/<\/?[^>]+(>|$)/g, '');
		await browser.close();
	} catch (e) {
		console.error(e);
		return c.json({ message: StatusPhrases.INTERNAL_SERVER_ERROR }, StatusCodes.INTERNAL_SERVER_ERROR);
	}

	// Step 3. Clean up HTML String
	const htmlStringExploded = htmlString.split('\n').map((line) => line.replace(/\s+/g, ' ').trim());
	htmlStringExploded.forEach((v, i) => (htmlStringExploded[i] = htmlStringExploded[i].trim()));
	const htmlFilterShortStrings = htmlStringExploded.filter((str) => str.length > SHORT_PARAGRAPH);
	htmlString = htmlFilterShortStrings.join(' ');

	console.log(htmlString);

	return c.json(ParsedJobDetails.data, StatusCodes.OK);
});

export default executejob;
