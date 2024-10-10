import { app } from '$lib/express';
import { Summarizer } from '$lib/summarizer';

// For testing purposes, will be removing this when the summarizer class gets done
export default function runJob() {
	app.get('/run', async (request, response) => {
		const summarize = new Summarizer(1, 'https://example.com');

		const result = await summarize.run();

		response.json({ hi: 'there', result });
	});
}
