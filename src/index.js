import 'dotenv/config';
import { app, port } from './lib/express';
import getJob from './routes/job/getJob';
import postJob from './routes/job/postJob';
import runJob from './routes/job/runJob';

const routes = [getJob, postJob, runJob];

routes.forEach((route) => route());

app.all('*', (request, response) => {
	response.status(404).json({ error: true, message: 'Path does not exist.' });
});

app.listen(port, () => {
	console.log(`Listening on http://localhost:${port}`);
});
