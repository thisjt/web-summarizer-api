import { app } from '$lib/express';

export default function postJob() {
	app.post('/job', (request, response) => {
		response.json({ job: 0 });
	});
}
