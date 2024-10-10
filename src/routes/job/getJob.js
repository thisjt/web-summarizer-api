import { app } from '$lib/express';

export default function getJob() {
	app.get('/job/:id?', (request, response) => {
		response.json({ job: request.params.id || 0 });
	});
}
