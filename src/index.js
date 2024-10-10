import 'dotenv/config';
import { app, port } from './lib/express';
import getJob from './routes/job/getJob';
import getJobs from './routes/job/getJobs';
import postJob from './routes/job/postJob';

const routes = [getJob, getJobs, postJob];

routes.forEach((route) => route());

app.all('*', (request, response) => {
	response.status(404).json({ error: true, message: 'Path does not exist.' });
});

app.listen(port, () => {
	console.log(`Listening on http://localhost:${port}`);
});
