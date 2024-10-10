import { app } from '$lib/express';
import { Summarizer } from '$lib/summarizer';

// For testing purposes, will be removing this when the summarizer class gets done
export default function runJob() {
	app.get('/run', async (request, response) => {
		const summarize = new Summarizer(1, 'https://seths.blog/2023/12/on-choosing-a-college/');

		const res = await summarize.run();

		response.json({ hi: 'there', res, logs: summarize.logs });
	});
}
