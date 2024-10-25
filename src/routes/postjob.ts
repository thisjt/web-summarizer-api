import app from '../lib/app';

const postjob = app.post('/job', (c) => {
	return c.text('Post Job!');
});

export default postjob;
