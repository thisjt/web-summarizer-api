import { expect } from 'vitest';
import { test } from 'vitest';
import { describe } from 'vitest';

const TESTURL = `http://localhost:${process.env.PORT}`;

const jobData = {
	exampleUrl: 'https://www.iana.org/help/example-domains',
	exampleUrlId: 0,
	exampleUrlSummary: null,
	nonexistentUrl: 'http://example.com/thislinkdoesnotexist',
	nonexistentUrlId: 0,
	nonexistentUrlSummary: null,
	noDomainUrl: 'https://thisdomaincouldpossiblynotexist1234abcd.com/article',
	noDomainUrlId: 0,
	noDomainUrlSummary: null,
};

describe('test', { timeout: 60000 }, () => {
	test.sequential('wait for dev server', async () => {
		await delay(5000);
		const server = await fetch(`${TESTURL}`);
		const check = await server.json();

		expect(check.error).toBe(true);
	});

	test.sequential('inserting exampleUrl into queue', async () => {
		const body = new URLSearchParams();
		body.append('url', jobData.exampleUrl);

		const newJob = await fetch(`${TESTURL}/job`, {
			method: 'POST',
			body,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});

		const newJobData = await newJob.json();

		expect(newJobData.status).toBe('queue');

		jobData.exampleUrlId = newJobData.id;
	});

	test.sequential('inserting nonexistentUrl into queue', async () => {
		const body = new URLSearchParams();
		body.append('url', jobData.nonexistentUrl);

		const nonJob = await fetch(`${TESTURL}/job`, {
			method: 'POST',
			body,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});

		const nonJobData = await nonJob.json();

		expect(nonJobData.status).toBe('queue');

		jobData.nonexistentUrlId = nonJobData.id;
	});

	test.sequential('inserting noDomainUrl into queue', async () => {
		const body = new URLSearchParams();
		body.append('url', jobData.noDomainUrl);

		const nonJob = await fetch(`${TESTURL}/job`, {
			method: 'POST',
			body,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});

		const nonJobData = await nonJob.json();

		expect(nonJobData.status).toBe('queue');

		jobData.noDomainUrlId = nonJobData.id;
	});

	test.sequential('check status of exampleUrl', async () => {
		await delay(200);

		const getJob = await fetch(`${TESTURL}/job/${jobData.exampleUrlId}`);
		const getJobData = await getJob.json();

		expect(getJobData.status).toBe('processing');
	});

	test.sequential('check status of nonexistentUrl', async () => {
		await delay(200);

		const getJob = await fetch(`${TESTURL}/job/${jobData.nonexistentUrlId}`);
		const getJobData = await getJob.json();

		expect(getJobData.status).toBe('processing');
	});

	test.sequential('check status of noDomainUrl', async () => {
		await delay(200);

		const getJob = await fetch(`${TESTURL}/job/${jobData.noDomainUrlId}`);
		const getJobData = await getJob.json();

		expect(getJobData.status).toBe('processing');
	});

	test.sequential('wait 15 seconds for jobs to finish', async () => {
		await delay(15000);
	});

	test.sequential('check status of exampleUrl again', async () => {
		const getJob = await fetch(`${TESTURL}/job/${jobData.exampleUrlId}`);
		const getJobData = await getJob.json();

		expect(getJobData.status).toBe('completed');
		jobData.exampleUrlSummary = getJobData;
	});

	test.sequential('check status of nonexistentUrl again', async () => {
		const getJob = await fetch(`${TESTURL}/job/${jobData.nonexistentUrlId}`);
		const getJobData = await getJob.json();

		expect(getJobData.status).toBe('failed');
		jobData.nonexistentUrlSummary = getJobData;
	});

	test.sequential('check status of noDomainUrl again', async () => {
		const getJob = await fetch(`${TESTURL}/job/${jobData.noDomainUrlId}`);
		const getJobData = await getJob.json();

		expect(getJobData.status).toBe('failed');
		jobData.noDomainUrlSummary = getJobData;
	});

	test.sequential('output fetch results', () => {
		console.log(jobData);
	});
});

/**@param {number} time */
async function delay(time) {
	await new Promise((res) => setTimeout(res, time));
}
