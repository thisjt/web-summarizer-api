import { OpenAPIHono } from '@hono/zod-openapi';
import type { Bindings } from './types';

const app = new OpenAPIHono<{ Bindings: Bindings }>();

export default app;
