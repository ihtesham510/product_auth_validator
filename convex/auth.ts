import { v } from 'convex/values'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { mutation, query } from './_generated/server'

const DEFAULT_USERNAME = 'admin'
const DEFAULT_PASSWORD = 'admin123'

function generateSessionId(): string {
	return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

async function getAdminCredentialsFromQuery(ctx: QueryCtx) {
	return await ctx.db.query('adminCredentials').first()
}

async function getAdminCredentialsFromMutation(ctx: MutationCtx) {
	return await ctx.db.query('adminCredentials').first()
}

async function initializeAdminCredentials(ctx: MutationCtx) {
	const existing = await getAdminCredentialsFromMutation(ctx)
	if (existing) {
		return existing
	}

	const defaultId = await ctx.db.insert('adminCredentials', {
		username: DEFAULT_USERNAME,
		password: DEFAULT_PASSWORD,
	})
	const credentials = await ctx.db.get(defaultId)
	if (!credentials) {
		throw new Error('Failed to initialize admin credentials')
	}
	return credentials
}

export const login = mutation({
	args: {
		username: v.string(),
		password: v.string(),
	},
	handler: async (ctx: MutationCtx, args) => {
		// Get or initialize admin credentials
		let credentials = await getAdminCredentialsFromMutation(ctx)

		if (!credentials) {
			credentials = await initializeAdminCredentials(ctx)
		}

		if (
			args.username !== credentials.username ||
			args.password !== credentials.password
		) {
			return 'Invalid username or password'
		}

		const sessionId = generateSessionId()

		await ctx.db.insert('sessions', {
			sessionId,
			username: args.username,
		})

		return { data: { sessionId } }
	},
})

export const getSession = query({
	args: {
		sessionId: v.optional(v.string()),
	},
	async handler(ctx, { sessionId }) {
		let session = null
		if (sessionId) {
			session =
				(await ctx.db
					.query('sessions')
					.withIndex('sessionId', q => q.eq('sessionId', sessionId))
					.first()) ?? null
		}
		return session
	},
})

export const getCurrentUser = query({
	args: {
		sessionId: v.string(),
	},
	handler: async (ctx: QueryCtx, args) => {
		const session = await ctx.db
			.query('sessions')
			.withIndex('sessionId', q => q.eq('sessionId', args.sessionId))
			.first()

		if (!session) {
			return null
		}

		return {
			username: session.username,
			sessionId: session.sessionId,
		}
	},
})

export const logout = mutation({
	args: {
		sessionId: v.string(),
	},
	handler: async (ctx: MutationCtx, args) => {
		const session = await ctx.db
			.query('sessions')
			.withIndex('sessionId', q => q.eq('sessionId', args.sessionId))
			.first()

		if (session) {
			await ctx.db.delete(session._id)
		}

		return { success: true }
	},
})

export const getAdminCredentials = query({
	handler: async (ctx: QueryCtx) => {
		const credentials = await getAdminCredentialsFromQuery(ctx)

		if (!credentials) {
			return null
		}

		return {
			username: credentials.username,
		}
	},
})

export const initializeDefaultCredentials = mutation({
	handler: async (ctx: MutationCtx) => {
		const credentials = await initializeAdminCredentials(ctx)
		return {
			username: credentials.username,
		}
	},
})

export const updateAdminCredentials = mutation({
	args: {
		username: v.string(),
		password: v.string(),
	},
	handler: async (ctx: MutationCtx, args) => {
		const credentials = await getAdminCredentialsFromMutation(ctx)

		if (credentials) {
			await ctx.db.patch(credentials._id, {
				username: args.username,
				password: args.password,
			})
		} else {
			await ctx.db.insert('adminCredentials', {
				username: args.username,
				password: args.password,
			})
		}

		return { success: true }
	},
})
