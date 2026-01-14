import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from 'convex-helpers/react/cache'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useLocalStorage } from '@mantine/hooks'
import { Spinner } from '@/components/ui/spinner'

export interface AuthContext {
	sessionId: string | null
	isAuthenticated: boolean
	login: (
		username: string,
		password: string,
	) => Promise<(typeof api.auth.login)['_returnType']>
	logout: () => Promise<void>
}

const authContext = createContext<AuthContext | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
	const [sessionId, setSessionId] = useLocalStorage<string | null>({
		key: 'session',
	})
	const session = useQuery(api.auth.getSession, {
		sessionId: sessionId ?? undefined,
	})

	const loginMutation = useMutation(api.auth.login)
	const logoutMutation = useMutation(api.auth.logout)
	const login = async (username: string, password: string) => {
		const res = await loginMutation({
			username,
			password,
		})
		if (typeof res === 'object' && res.data) {
			setSessionId(res.data.sessionId)
		}
		return res
	}

	const logout = async () => {
		if (sessionId) {
			try {
				await logoutMutation({ sessionId })
			} catch (error) {
				console.error('Logout error:', error)
			}
		}
		setSessionId(null)
	}
	if (typeof session === 'undefined')
		return (
			<div className='h-screen w-full flex justify-center items-center'>
				<Spinner className='size-12' />
			</div>
		)

	return (
		<authContext.Provider
			value={{
				sessionId,
				isAuthenticated: !!session,
				login,
				logout,
			}}
		>
			{children}
		</authContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(authContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
