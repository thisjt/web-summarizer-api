import express from 'express';

const app = express();
const port = 5013;

app.get('/', (request, response) => {
	response.send('Hi');
});

app.listen(port, () => {
	console.log(`Listening on http://localhost:${port}`);
});
