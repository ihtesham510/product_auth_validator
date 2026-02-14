import { ConvexError, v } from 'convex/values'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { mutation, query } from './_generated/server'

const DEFAULT_USERNAME = 'admin'
const DEFAULT_PASSWORD = 'admin123'

function generateSessionId(): string {
	return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

async function getAdminCredentialsFromQuery(ctx: QueryCtx) {
	const credentials = await ctx.db.query('adminCredentials').first()
	if (credentials) {
		const decrypted_username = await decrypt(credentials?.username)
		const decrypted_password = await decrypt(credentials?.password)
		return {
			...credentials,
			decrypted_username,
			decrypted_password,
		}
	}
	return credentials
}

async function getAdminCredentialsFromMutation(ctx: MutationCtx) {
	const credentials = await ctx.db.query('adminCredentials').first()
	if (credentials) {
		const decrypted_username = await decrypt(credentials?.username)
		const decrypted_password = await decrypt(credentials?.password)
		return {
			...credentials,
			username: decrypted_username,
			password: decrypted_password,
		}
	}
	return credentials
}

async function initializeAdminCredentials(ctx: MutationCtx) {
	const existing = await getAdminCredentialsFromMutation(ctx)
	if (existing) {
		return existing
	}
	const encryptedDefaultUsername = await encrypt(DEFAULT_USERNAME)
	const encryptedDefaultPassword = await encrypt(DEFAULT_PASSWORD)

	const defaultId = await ctx.db.insert('adminCredentials', {
		username: encryptedDefaultUsername,
		password: encryptedDefaultPassword,
	})
	const credentials = await ctx.db.get(defaultId)
	if (!credentials) {
		throw new Error('Failed to initialize admin credentials')
	}
	return {
		...credentials,
		username: await decrypt(credentials.username),
		password: await decrypt(credentials.password),
	}
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
			username: await decrypt(credentials.username),
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
		const encryptedUsername = await encrypt(args.username)
		const encryptedPassword = await encrypt(args.password)

		if (credentials) {
			await ctx.db.patch(credentials._id, {
				username: encryptedUsername,
				password: encryptedPassword,
			})
		} else {
			await ctx.db.insert('adminCredentials', {
				username: encryptedUsername,
				password: encryptedPassword,
			})
		}

		return { success: true }
	},
})

/**
 * Encrypt a string using AES-256-GCM with Web Crypto API
 * @param payload - The string to encrypt
 * @param secretKey - Your secret key (any length)
 * @returns Encrypted string in format: iv:ciphertext (hex encoded)
 */
export async function encrypt(payload: string): Promise<string> {
	const secretKey = process.env.SECRET_KEY
	if (!secretKey) throw new ConvexError('SECRET_KEY is required')

	const encoder = new TextEncoder()

	// Derive a 256-bit key from secret using SHA-256
	const keyMaterial = await crypto.subtle.digest(
		'SHA-256',
		encoder.encode(secretKey),
	)

	// Import the key for AES-GCM
	const key = await crypto.subtle.importKey(
		'raw',
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt'],
	)

	// Generate random 12-byte IV
	const iv = crypto.getRandomValues(new Uint8Array(12))

	// Encrypt the payload
	const encryptedBuffer = await crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv: iv,
		},
		key,
		encoder.encode(payload),
	)

	// Convert to hex strings
	const encryptedArray = new Uint8Array(encryptedBuffer)
	const ivHex = Array.from(iv)
		.map(b => b.toString(16).padStart(2, '0'))
		.join('')
	const encryptedHex = Array.from(encryptedArray)
		.map(b => b.toString(16).padStart(2, '0'))
		.join('')

	// Return format: iv:encrypted
	return `${ivHex}:${encryptedHex}`
}

/**
 * Decrypt a string using AES-256-GCM with Web Crypto API
 * @param encryptedPayload - The encrypted string (iv:ciphertext format)
 * @param secretKey - Your secret key (must be same as encryption)
 * @returns Decrypted string
 */
export async function decrypt(encryptedPayload: string): Promise<string> {
	const secretKey = process.env.SECRET_KEY
	if (!secretKey) throw new ConvexError('SECRET_KEY is required')

	try {
		// Parse the encrypted data
		const parts = encryptedPayload.split(':')
		if (parts.length !== 2) {
			throw new ConvexError(
				'Invalid encrypted format. Expected format: iv:ciphertext',
			)
		}

		const [ivHex, encryptedHex] = parts

		// Convert hex strings back to Uint8Array
		const iv = new Uint8Array(
			ivHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)),
		)
		const encrypted = new Uint8Array(
			encryptedHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)),
		)

		const encoder = new TextEncoder()

		// Derive the same key
		const keyMaterial = await crypto.subtle.digest(
			'SHA-256',
			encoder.encode(secretKey),
		)

		const key = await crypto.subtle.importKey(
			'raw',
			keyMaterial,
			{ name: 'AES-GCM', length: 256 },
			false,
			['decrypt'],
		)

		// Decrypt
		const decryptedBuffer = await crypto.subtle.decrypt(
			{
				name: 'AES-GCM',
				iv: iv,
			},
			key,
			encrypted,
		)

		// Convert back to string
		const decoder = new TextDecoder()
		return decoder.decode(decryptedBuffer)
	} catch (error) {
		throw new ConvexError(
			`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}
