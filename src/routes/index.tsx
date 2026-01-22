import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { VerificationForm } from '@/components/VerificationForm'
import { ImportCodes } from '@/components/ImportCodes'

export const Route = createFileRoute('/')({
	component: App,
})

function App() {
	const { isAuthenticated } = useAuth()

	if (!isAuthenticated) {
		return (
			<div className='min-h-screen flex flex-col items-center justify-center px-4 py-8'>
				<VerificationForm />
			</div>
		)
	}

	return (
		<div className='min-h-screen flex  items-center justify-center'>
			<ImportCodes />
		</div>
	)
}
