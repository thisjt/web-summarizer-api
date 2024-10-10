import { app } from '$lib/express';

export default function getJobs() {
	app.get('/job', (request, response) => {
		response.json({ jobs: [] });
	});
}
