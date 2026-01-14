import { TanStackDevtools } from '@tanstack/react-devtools'
import {
	createRootRouteWithContext,
	Outlet,
	useRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { useEffect } from 'react'
import { NotFound } from '@/components/NotFound'
import Header from '../components/Header'
import { type AuthContext, useAuth } from '../contexts/AuthContext'

export const Route = createRootRouteWithContext<AuthContext>()({
	component: RootComponent,
	notFoundComponent: NotFound,
})

function RootComponent() {
	const router = useRouter()
	const { isAuthenticated } = useAuth()

	// biome-ignore lint/correctness/useExhaustiveDependencies: <" When isAuthenticated value changes invalidate the router ">
	useEffect(() => {
		router.invalidate()
	}, [router.invalidate, isAuthenticated])

	return (
		<div className='relative h-screen'>
			{isAuthenticated && <Header />}
			<Outlet />
			<TanStackDevtools
				config={{
					position: 'bottom-right',
				}}
				plugins={[
					{
						name: 'Tanstack Router',
						render: <TanStackRouterDevtoolsPanel />,
					},
				]}
			/>
		</div>
	)
}
