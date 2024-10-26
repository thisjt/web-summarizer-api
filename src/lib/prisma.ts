import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { D1Database } from '@cloudflare/workers-types';

let prismaMemo: PrismaClient;

export default function prisma(d1Database: D1Database): PrismaClient {
	if (prismaMemo) return prismaMemo;

	const adapter = new PrismaD1(d1Database);
	const prismaInit = new PrismaClient({ adapter });
	prismaMemo = prismaInit;
	return prismaInit;
}
