import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	places: defineTable({
		name: v.string(),
		geo: v.object({
			lat: v.number(),
			lng: v.number(),
		}),
		address: v.string(),
		description: v.string(),
		photo: v.optional(v.string()),
	}),
	lists: defineTable({
		name: v.string(),
		description: v.string(),
		places: v.array(
			v.object({
				place_id: v.id('places'),
				note: v.string(),
			}),
		),
		owner: v.string(),
	}),
});
