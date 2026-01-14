import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
	sessions: defineTable({
		sessionId: v.string(),
		username: v.string(),
	}).index('sessionId', ['sessionId']),

	adminCredentials: defineTable({
		username: v.string(),
		password: v.string(),
	}),

	codes: defineTable({
		code: v.string(),
		isValid: v.boolean(),
	}).index('code', ['code']),

	verified_codes: defineTable({
		name: v.string(),
		phone: v.string(),
		code: v.id('codes'),
	}).index('code', ['code']),

	prize_definitions: defineTable({
		prize_name: v.string(),
		description: v.string(),
	}),

	prizes: defineTable({
		code_id: v.id('codes'),
		prize_definition_id: v.id('prize_definitions'),
	})
		.index('code_id', ['code_id'])
		.index('prize_definition_id', ['prize_definition_id']),

	claimable_prizes: defineTable({
		prize_id: v.id('prizes'),
		code_id: v.id('codes'),
		verified_code_id: v.id('verified_codes'),
		cnic_image_url: v.string(),
		status: v.union(v.literal('claimed'), v.literal('unClaimed')),
		storageId: v.id('_storage'),
		claimed_at: v.optional(v.number()),
	})
		.index('prize_id', ['prize_id'])
		.index('code_id', ['code_id'])
		.index('verified_code_id', ['verified_code_id']),
})
