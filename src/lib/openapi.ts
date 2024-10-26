import { apiReference } from '@scalar/hono-api-reference';
import packageJSON from './../../package.json';
import type { OpenAPIHono } from '@hono/zod-openapi';

export function mountOpenApi(app: OpenAPIHono) {
	app.doc('/_openapischema', {
		openapi: '3.1.0',
		info: {
			version: packageJSON.version,
			title: `${packageJSON.properName} - Documentation`,
			description: packageJSON.description,
			contact: {
				name: packageJSON.author,
				url: packageJSON.authorUrl,
				email: packageJSON.authorEmail,
			},
		},
	});

	app.get(
		'/documentation',
		apiReference({
			theme: 'deepSpace',
			layout: 'modern',
			defaultHttpClient: {
				targetKey: 'javascript',
				clientKey: 'fetch',
			},
			hideDownloadButton: true,
			withDefaultFonts: false,
			defaultOpenAllTags: true,
			spec: {
				url: '/_openapischema',
			},
		}),
	);
}
