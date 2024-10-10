import express from 'express';

export const app = express();

// middleware, i'm assuming we always send json to requestor
app.use((request, response, next) => {
	response.setHeader('content-type', 'application/json');
	next();
});

export const port = 5013;
