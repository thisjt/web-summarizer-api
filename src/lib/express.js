import express from 'express';

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// middleware, i'm assuming we always send json to requestor
app.use((request, response, next) => {
	response.setHeader('content-type', 'application/json');
	next();
});

export const port = process.env.PORT || 5013;
