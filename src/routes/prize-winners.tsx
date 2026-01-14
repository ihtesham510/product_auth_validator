import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, CheckCircle2, XCircle, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import type { Id } from 'convex/_generated/dataModel'

export const Route = createFileRoute('/prize-winners')({
	component: PrizeWinnersPage,
	loader({ context }) {
		if (!context.isAuthenticated) {
			throw redirect({
				to: '/login',
			})
		}
	},
})

function PrizeWinnersPage() {
	const claimablePrizes = useQuery(api.prizes.getClaimablePrizes)
	const markPrizeAsClaimed = useMutation(api.prizes.markPrizeAsClaimed)
	const [imageDialogOpen, setImageDialogOpen] = useState(false)
	const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)

	if (claimablePrizes === undefined) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='text-gray-500'>Loading...</div>
			</div>
		)
	}

	const handleMarkAsClaimed = async (
		claimablePrizeId: Id<'claimable_prizes'>,
	) => {
		try {
			await markPrizeAsClaimed({ claimable_prize_id: claimablePrizeId })
		} catch (err) {
			console.error('Failed to mark prize as claimed:', err)
		}
	}

	const formatDate = (timestamp: number | undefined) => {
		if (!timestamp) return 'N/A'
		return new Date(timestamp).toLocaleString()
	}

	return (
		<div className='min-h-screen bg-gray-100 px-4 py-8'>
			<div className='max-w-7xl mx-auto'>
				<Card>
					<CardHeader>
						<CardTitle className='text-2xl font-bold'>Prize Winners</CardTitle>
						<CardDescription>
							View all users who have won prizes and mark prizes as claimed
						</CardDescription>
					</CardHeader>
					<CardContent>
						{claimablePrizes.length === 0 ? (
							<div className='text-center py-8 text-gray-500'>
								No prize winners found.
							</div>
						) : (
							<div className='rounded-md border'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>User</TableHead>
											<TableHead>Code</TableHead>
											<TableHead>Prize</TableHead>
											<TableHead>CNIC Image</TableHead>
											<TableHead>Claimed At</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{claimablePrizes.map(claimablePrize => (
											<TableRow key={claimablePrize.claimable_prize_id}>
												<TableCell>
													{claimablePrize.user ? (
														<div className='text-sm'>
															<div className='font-medium'>
																{claimablePrize.user.name}
															</div>
															<div className='text-gray-500'>
																{claimablePrize.user.phone}
															</div>
														</div>
													) : (
														<span className='text-gray-400'>N/A</span>
													)}
												</TableCell>
												<TableCell className='font-mono'>
													{claimablePrize.code || 'N/A'}
												</TableCell>
												<TableCell>
													{claimablePrize.prize_definition ? (
														<div className='text-sm'>
															<Badge
																variant='outline'
																className='bg-yellow-50 mb-1'
															>
																<Trophy className='h-3 w-3 mr-1' />
																{claimablePrize.prize_definition.prize_name}
															</Badge>
														</div>
													) : (
														<span className='text-gray-400'>N/A</span>
													)}
												</TableCell>
												<TableCell>
													{claimablePrize.cnic_image_url ? (
														<Button
															variant='outline'
															size='sm'
															onClick={() => {
																setSelectedImageUrl(
																	claimablePrize.cnic_image_url,
																)
																setImageDialogOpen(true)
															}}
														>
															<ImageIcon className='h-4 w-4 mr-1' />
															View Image
														</Button>
													) : (
														<span className='text-gray-400'>N/A</span>
													)}
												</TableCell>
												<TableCell className='text-sm'>
													{formatDate(claimablePrize.claimed_at)}
												</TableCell>
												<TableCell>
													{claimablePrize.status === 'claimed' ? (
														<Badge variant='default' className='bg-green-500'>
															<CheckCircle2 className='h-3 w-3 mr-1' />
															Claimed
														</Badge>
													) : (
														<Badge variant='destructive'>
															<XCircle className='h-3 w-3 mr-1' />
															Unclaimed
														</Badge>
													)}
												</TableCell>
												<TableCell>
													{claimablePrize.status === 'unClaimed' && (
														<Button
															variant='default'
															size='sm'
															onClick={() =>
																handleMarkAsClaimed(
																	claimablePrize.claimable_prize_id,
																)
															}
														>
															Mark as Claimed
														</Button>
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

			<Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
				<DialogContent className='max-w-2xl'>
					<DialogHeader>
						<DialogTitle>CNIC Image</DialogTitle>
						<DialogDescription>Front side of the CNIC card</DialogDescription>
					</DialogHeader>
					{selectedImageUrl && (
						<div className='flex justify-center'>
							<img
								src={selectedImageUrl}
								alt='CNIC'
								className='max-w-full h-auto rounded-md border'
							/>
						</div>
					)}
					<DialogFooter>
						<Button onClick={() => setImageDialogOpen(false)}>Close</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
