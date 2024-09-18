import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import schema from './schema';

export const getAll = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('places').collect();
	},
});

export const get = query({
	args: {
		id: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query('places')
			.filter((q) => q.eq(q.field('_id'), args.id))
			.first();
	},
});

export const create = mutation({
	args: schema.tables.places.validator,
	handler: async (ctx, args) => {
		const id = await ctx.db.insert('places', args);

		return id;
	},
});
