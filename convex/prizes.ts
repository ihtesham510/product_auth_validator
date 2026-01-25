import { ConvexError, v } from 'convex/values'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { mutation, query } from './_generated/server'

// Prize Definition Management
export const createPrizeDefinition = mutation({
	args: {
		prize_name: v.string(),
		description: v.string(),
		requires_cnic: v.boolean(),
	},
	handler: async (ctx: MutationCtx, args) => {
		const prizeDefinitionId = await ctx.db.insert('prize_definitions', {
			prize_name: args.prize_name.trim(),
			description: args.description.trim(),
			requires_cnic: args.requires_cnic,
		})
		return { success: true, id: prizeDefinitionId }
	},
})

export const getAllPrizeDefinitions = query({
	handler: async (ctx: QueryCtx) => {
		const prizeDefinitions = await ctx.db.query('prize_definitions').collect()
		return prizeDefinitions
	},
})

export const updatePrizeDefinition = mutation({
	args: {
		prize_definition_id: v.id('prize_definitions'),
		prize_name: v.string(),
		description: v.string(),
		requires_cnic: v.boolean(),
	},
	handler: async (ctx: MutationCtx, args) => {
		await ctx.db.patch(args.prize_definition_id, {
			prize_name: args.prize_name.trim(),
			description: args.description.trim(),
			requires_cnic: args.requires_cnic,
		})
		return { success: true }
	},
})

export const deletePrizeDefinition = mutation({
	args: {
		prize_definition_id: v.id('prize_definitions'),
	},
	handler: async (ctx: MutationCtx, args) => {
		// Check if prize definition is used by any prizes
		const prizesUsingDefinition = await ctx.db
			.query('prizes')
			.withIndex('prize_definition_id', q =>
				q.eq('prize_definition_id', args.prize_definition_id),
			)
			.first()

		if (prizesUsingDefinition) {
			throw new Error(
				'Cannot delete prize definition. It is assigned to one or more codes.',
			)
		}

		await ctx.db.delete(args.prize_definition_id)
		return { success: true }
	},
})

// Prize Assignment to Codes
export const assignPrizeToCode = mutation({
	args: {
		code_id: v.id('codes'),
		prize_definition_id: v.id('prize_definitions'),
	},
	handler: async (ctx: MutationCtx, args) => {
		// Check if code already has a prize
		const existingPrize = await ctx.db
			.query('prizes')
			.withIndex('code_id', q => q.eq('code_id', args.code_id))
			.first()

		if (existingPrize) {
			// Update existing prize assignment
			await ctx.db.patch(existingPrize._id, {
				prize_definition_id: args.prize_definition_id,
			})
			return { success: true, updated: true }
		}

		// Create new prize assignment
		const prizeId = await ctx.db.insert('prizes', {
			code_id: args.code_id,
			prize_definition_id: args.prize_definition_id,
		})
		return { success: true, id: prizeId }
	},
})

export const removePrizeFromCode = mutation({
	args: {
		code_id: v.id('codes'),
	},
	handler: async (ctx: MutationCtx, args) => {
		const prize = await ctx.db
			.query('prizes')
			.withIndex('code_id', q => q.eq('code_id', args.code_id))
			.first()

		if (prize) {
			await ctx.db.delete(prize._id)
			return { success: true }
		}

		return { success: false, error: 'No prize found for this code' }
	},
})

// Prize Queries
export const getPrizeByCodeId = query({
	args: {
		code_id: v.id('codes'),
	},
	handler: async (ctx: QueryCtx, args) => {
		const prize = await ctx.db
			.query('prizes')
			.withIndex('code_id', q => q.eq('code_id', args.code_id))
			.first()

		if (!prize) {
			return null
		}

		const prizeDefinition = await ctx.db.get(prize.prize_definition_id)
		if (!prizeDefinition) {
			return null
		}

		return {
			prize_id: prize._id,
			prize_definition: {
				id: prizeDefinition._id,
				prize_name: prizeDefinition.prize_name,
				description: prizeDefinition.description,
			},
		}
	},
})

export const getAllPrizes = query({
	handler: async (ctx: QueryCtx) => {
		const prizes = await ctx.db.query('prizes').collect()
		const prizesWithDetails = await Promise.all(
			prizes.map(async prize => {
				const code = await ctx.db.get(prize.code_id)
				const prizeDefinition = await ctx.db.get(prize.prize_definition_id)
				return {
					prize_id: prize._id,
					code_id: prize.code_id,
					code: code?.code || null,
					prize_definition: prizeDefinition
						? {
								id: prizeDefinition._id,
								prize_name: prizeDefinition.prize_name,
								description: prizeDefinition.description,
							}
						: null,
				}
			}),
		)
		return prizesWithDetails
	},
})

export const hasClaimed = query({
	args: {
		id: v.optional(v.id('verified_codes')),
	},
	async handler(ctx, { id }) {
		if (!id) return
		return !!(await ctx.db
			.query('claimable_prizes')
			.withIndex('verified_code_id', q => q.eq('verified_code_id', id))
			.first())
	},
})

export const enterClaimablePrize = mutation({
	args: {
		verified_code_id: v.id('verified_codes'),
		cnic_image_url: v.optional(v.string()),
		storageId: v.optional(v.id('_storage')),
	},
	async handler(ctx, args) {
		const verified_code = await ctx.db.get(args.verified_code_id)
		if (!verified_code) {
			return 'Not Verified'
		}
		const code = await ctx.db.get(verified_code.code)
		if (!code) return 'code not found'

		const claimable_prize = await ctx.db
			.query('claimable_prizes')
			.withIndex('verified_code_id', q =>
				q.eq('verified_code_id', args.verified_code_id),
			)
			.first()
		const prize = await ctx.db
			.query('prizes')
			.withIndex('code_id', q => q.eq('code_id', code._id))
			.first()

		if (claimable_prize) {
			return 'already Claimed'
		}
		if (!prize || !code) {
			return 'code not found'
		}
		return await ctx.db.insert('claimable_prizes', {
			prize_id: prize._id,
			code_id: code._id,
			storageId: args.storageId,
			cnic_image_url: args.cnic_image_url,
			verified_code_id: args.verified_code_id,
			status: 'unClaimed',
		})
	},
})
export const markPrize = mutation({
	args: {
		id: v.id('claimable_prizes'),
	},
	async handler(ctx, args) {
		const prize = await ctx.db.get(args.id)
		if (!prize) throw new ConvexError('Claimable Prize not found')
		if (prize.status == 'claimed')
			throw new ConvexError('Prize has already been claimed')
		await ctx.db.patch(prize._id, { ...prize, status: 'claimed' })
	},
})

export const getClaimablePrizes = query({
	handler: async (ctx: QueryCtx) => {
		const claimablePrizes = await ctx.db.query('claimable_prizes').collect()
		return await Promise.all(
			claimablePrizes.map(async claimablePrize => {
				const prize = await ctx.db.get(claimablePrize.prize_id)
				const code = await ctx.db.get(claimablePrize.code_id)
				const verifiedCode = await ctx.db.get(claimablePrize.verified_code_id)

				let prizeDefinition = null
				if (prize) {
					const pd = await ctx.db.get(prize.prize_definition_id)
					if (pd) {
						prizeDefinition = {
							id: pd._id,
							prize_name: pd.prize_name,
							description: pd.description,
						}
					}
				}

				return {
					claimable_prize_id: claimablePrize._id,
					code: code?.code ?? null,
					user: verifiedCode
						? {
								name: verifiedCode.name,
								phone: verifiedCode.phone,
							}
						: null,
					prize_definition: prizeDefinition,
					cnic_image_url: claimablePrize.cnic_image_url,
					status: claimablePrize.status,
					claimed_at: claimablePrize.claimed_at,
				}
			}),
		)
	},
})

export const markPrizeAsClaimed = mutation({
	args: {
		claimable_prize_id: v.id('claimable_prizes'),
	},
	handler: async (ctx: MutationCtx, args) => {
		await ctx.db.patch(args.claimable_prize_id, {
			status: 'claimed',
			claimed_at: Date.now(),
		})
		return { success: true }
	},
})
