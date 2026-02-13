import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from 'convex-helpers/react/cache'
import { Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/verified-codes')({
	component: VerifiedCodesPage,
	loader({ context }) {
		if (!context.isAuthenticated) {
			throw redirect({
				to: '/login',
			})
		}
	},
})

function VerifiedCodesPage() {
	const verifiedCodes = useQuery(api.codes.getAllVerifiedCodes)

	if (verifiedCodes === undefined) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='text-gray-500'>Loading...</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-100 px-4 py-8'>
			<div className='max-w-full mx-auto'>
				<Card>
					<CardHeader>
						<CardTitle className='text-2xl font-bold'>Verified Codes</CardTitle>
						<CardDescription>
							View all codes that have been verified by users
						</CardDescription>
					</CardHeader>
					<CardContent>
						{verifiedCodes.length === 0 ? (
							<div className='text-center py-8 text-gray-500'>
								No verified codes found.
							</div>
						) : (
							<div className='rounded-md border'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>#</TableHead>
											<TableHead>Carton</TableHead>
											<TableHead>Name</TableHead>
											<TableHead>Phone</TableHead>
											<TableHead>Code</TableHead>
											<TableHead>Prize</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{verifiedCodes.map(verifiedCode => (
											<TableRow key={verifiedCode.id}>
												<TableCell className='font-mono'>
													{verifiedCode.serial}
												</TableCell>
												<TableCell className='font-mono'>
													{verifiedCode.carton}
												</TableCell>
												<TableCell className='font-medium'>
													{verifiedCode.name}
												</TableCell>
												<TableCell>{verifiedCode.phone}</TableCell>

												<TableCell className='font-mono'>
													{verifiedCode.code}
												</TableCell>
												<TableCell>
													{verifiedCode.prizeName ? (
														<Badge variant='outline' className='bg-yellow-50'>
															<Trophy className='h-3 w-3 mr-1' />
															{verifiedCode.prizeName}
														</Badge>
													) : (
														<span className='text-gray-400'>No prize</span>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
