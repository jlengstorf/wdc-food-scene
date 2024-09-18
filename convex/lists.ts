import { id, partial, string } from 'convex-helpers/validators';
import { query, mutation } from './_generated/server';
import schema from './schema';

export const getAll = query({
	args: {},
	handler: async (ctx) => {
		const data = await ctx.db.query('lists').collect();

		const withPlaces = await Promise.all(
			data.map(async (item) => {
				const places = await Promise.all(
					item.places.map(async (place) => {
						const data = await ctx.db.get(place.place_id);

						return {
							note: place.note,
							place: data,
						};
					}),
				);

				return {
					...item,
					places,
				};
			}),
		);

		return withPlaces;
	},
});

export const getAllByOwner = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (identity === null) {
			throw new Error('not authenticated');
		}

		const data = await ctx.db
			.query('lists')
			.filter((q) => q.eq(q.field('owner'), identity.subject))
			.collect();

		const withPlaces = await Promise.all(
			data.map(async (item) => {
				const places = await Promise.all(
					item.places.map(async (place) => {
						const data = await ctx.db.get(place.place_id);

						return {
							note: place.note,
							place: data,
						};
					}),
				);

				return {
					...item,
					places,
				};
			}),
		);

		return withPlaces;
	},
});

export const getById = query({
	args: { list_id: id('lists') },
	handler: async (ctx, args) => {
		const data = await ctx.db.get(args.list_id);
		if (!data || !data.places) {
			throw new Error('invalid list');
		}

		const places = await Promise.all(
			data.places.map(async (place) => {
				const data = await ctx.db.get(place.place_id);

				return {
					note: place.note,
					place: data,
				};
			}),
		);

		const list = {
			...data,
			places,
		};

		return list;
	},
});

export const create = mutation({
	args: partial(schema.tables.lists.validator.fields),
	handler: async (ctx, args) => {
		if (!args.name || !args.description) {
			throw new Error('missing required values');
		}

		const identity = await ctx.auth.getUserIdentity();
		if (identity === null) {
			throw new Error('not authenticated');
		}

		const newList = {
			name: args.name as string,
			description: args.description as string,
			places: args.places ?? [],
			owner: identity.subject as string,
		};

		const id = await ctx.db.insert('lists', newList);

		return id;
	},
});

export const addPlace = mutation({
	args: { list_id: id('lists'), place_id: id('places'), note: string },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (identity === null) {
			throw new Error('not authenticated');
		}

		const list = await ctx.db.get(args.list_id);

		await ctx.db.patch(args.list_id, {
			places: [
				...(list?.places ?? []),
				{ place_id: args.place_id, note: args.note },
			],
		});
	},
});
