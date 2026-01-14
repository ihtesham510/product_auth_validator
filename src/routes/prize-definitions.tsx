import { createFileRoute, redirect } from '@tanstack/react-router'
import { PrizeDefinitions } from '@/components/PrizeDefinitions'

export const Route = createFileRoute('/prize-definitions')({
	component: PrizeDefinitionsPage,
	loader({ context }) {
		if (!context.isAuthenticated) {
			throw redirect({
				to: '/login',
			})
		}
	},
})

function PrizeDefinitionsPage() {
	return (
		<div className='min-h-screen bg-gray-100 px-4 py-8'>
			<div className='max-w-7xl mx-auto'>
				<PrizeDefinitions />
			</div>
		</div>
	)
}
