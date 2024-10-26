import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import { UNAUTHORIZED } from 'stoker/http-status-phrases';

type Bindings = {
	TOKEN: string;
};

const app = new OpenAPIHono<{ Bindings: Bindings }>();

export const TokenSchema = z.object({
	token: z.coerce.string().openapi({
		title: 'Authentication Token',
		description: 'Token used to access this API.',
		type: 'string',
		format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
		example: 'mYpoDaKd5RNTbYceRgKD9b3gAymKqYBk',
	}),
});

const auth = app.use('/*', async (c, next) => {
	if (c.req.path === '/') return c.redirect('/documentation', 302);
	if (c.req.path === '/documentation' || c.req.path === '/_openapischema') {
		await next();
		return;
	}

	const token = c.req.query('token');
	const parsedToken = TokenSchema.parse({ token });

	if (!c.env?.TOKEN || parsedToken.token !== c.env.TOKEN) {
		return c.json({ message: UNAUTHORIZED });
	}

	console.log('hey', c.req.path);

	await next();
});

export default auth;
