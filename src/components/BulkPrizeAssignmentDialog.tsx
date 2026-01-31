import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { useMutation, useQuery } from 'convex/react'
import {
	AlertCircle,
	AlertTriangle,
	Check,
	ChevronsUpDown,
	Trophy,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type Code = (typeof api.codes.getAllCodes)['_returnType'][0]

interface BulkPrizeAssignmentDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	selectedCodeIds: Id<'codes'>[]
	allCodes?: Code[]
	onSuccess?: () => void
}

export function BulkPrizeAssignmentDialog({
	open,
	onOpenChange,
	selectedCodeIds,
	allCodes,
	onSuccess,
}: BulkPrizeAssignmentDialogProps) {
	const prizeDefinitions = useQuery(api.prizes.getAllPrizeDefinitions)
	const assignPrizeToCode = useMutation(api.prizes.assignPrizeToCode)

	const [prizeComboboxOpen, setPrizeComboboxOpen] = useState(false)
	const [selectedPrizeId, setSelectedPrizeId] =
		useState<Id<'prize_definitions'>>()
	const [isAssigning, setIsAssigning] = useState(false)

	const selectedPrize = prizeDefinitions?.find(p => p._id === selectedPrizeId)

	const validationResult = useMemo(() => {
		if (!allCodes)
			return { isValid: true, invalidCodes: [], codesWithPrizes: [] }

		const selectedCodes = allCodes.filter(code =>
			selectedCodeIds.includes(code.id),
		)

		const invalidCodes = selectedCodes.filter(code => !code.isValid)
		const codesWithPrizes = selectedCodes.filter(
			code => code.prizeName !== null,
		)

		const isValid = invalidCodes.length === 0 && codesWithPrizes.length === 0

		return {
			isValid,
			invalidCodes,
			codesWithPrizes,
			totalInvalid: invalidCodes.length + codesWithPrizes.length,
		}
	}, [selectedCodeIds, allCodes])

	const handleAssignPrize = async () => {
		if (!validationResult.isValid) {
			toast.error(
				'Please select only valid codes that do not have prizes assigned',
			)
			return
		}

		if (!selectedPrizeId) {
			toast.error('Please select a prize')
			return
		}

		if (selectedCodeIds.length === 0) {
			toast.error('No codes selected')
			return
		}

		setIsAssigning(true)
		let successCount = 0
		let errorCount = 0

		try {
			await Promise.allSettled(
				selectedCodeIds.map(codeId =>
					assignPrizeToCode({
						code_id: codeId,
						prize_definition_id: selectedPrizeId,
					}),
				),
			).then(results => {
				results.forEach(result => {
					if (result.status === 'fulfilled') {
						successCount++
					} else {
						errorCount++
					}
				})
			})

			if (errorCount === 0) {
				toast.success(
					`Successfully assigned prize to ${successCount} code${successCount !== 1 ? 's' : ''}!`,
				)
			} else {
				toast.warning(
					`Assigned prize to ${successCount} code${successCount !== 1 ? 's' : ''}, ${errorCount} failed`,
				)
			}

			setSelectedPrizeId(undefined)
			onOpenChange(false)
			onSuccess?.()
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to assign prizes',
			)
		} finally {
			setIsAssigning(false)
		}
	}

	const handleClose = () => {
		setSelectedPrizeId(undefined)
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Assign Prize to Selected Codes</DialogTitle>
					<DialogDescription>
						Select a prize to assign to {selectedCodeIds.length} selected code
						{selectedCodeIds.length !== 1 ? 's' : ''}
					</DialogDescription>
				</DialogHeader>
				<Alert variant='default'>
					<AlertCircle />
					<AlertTitle>Prize Cannot be changed once assigned</AlertTitle>
					<AlertDescription>
						Once a prize is assigned, it cannot be changed due to security
						constraints.
					</AlertDescription>
				</Alert>
				{validationResult.isValid ? (
					<div className='space-y-4'>
						<div className='flex flex-col'>
							<p className='text-sm font-medium mb-2'>Select Prize</p>
							<Popover
								open={prizeComboboxOpen}
								onOpenChange={setPrizeComboboxOpen}
							>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										role='combobox'
										aria-expanded={prizeComboboxOpen}
										className='w-full justify-between'
										disabled={isAssigning}
									>
										{selectedPrize
											? selectedPrize.prize_name
											: 'Select prize...'}
										<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-full p-0'>
									<Command>
										<CommandInput
											placeholder='Search prizes...'
											className='h-9'
										/>
										<CommandList>
											<CommandEmpty>No prize found.</CommandEmpty>
											<CommandGroup>
												{prizeDefinitions?.map(prize => (
													<CommandItem
														key={prize._id}
														value={prize.prize_name}
														onSelect={() => {
															setSelectedPrizeId(prize._id)
															setPrizeComboboxOpen(false)
														}}
													>
														<Trophy className='mr-2 h-4 w-4 text-yellow-600' />
														<div className='flex flex-col flex-1'>
															<span className='font-medium'>
																{prize.prize_name}
															</span>
															<span className='text-xs text-gray-500 truncate'>
																{prize.description}
															</span>
														</div>
														<Check
															className={cn(
																'ml-auto h-4 w-4',
																selectedPrizeId === prize._id
																	? 'opacity-100'
																	: 'opacity-0',
															)}
														/>
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>
					</div>
				) : (
					<Alert variant='destructive'>
						<AlertTriangle className='h-5 w-5' />
						<AlertTitle>Invalid Selection</AlertTitle>
						<AlertDescription className='space-y-2'>
							<div>Please select codes that meet the following criteria:</div>
							<ul className='list-disc list-inside space-y-1 mt-2'>
								{validationResult.invalidCodes.length > 0 && (
									<li>
										{validationResult.invalidCodes.length} code
										{validationResult.invalidCodes.length !== 1 ? 's' : ''} are
										not valid (already used)
									</li>
								)}
								{validationResult.codesWithPrizes.length > 0 && (
									<li>
										{validationResult.codesWithPrizes.length} code
										{validationResult.codesWithPrizes.length !== 1 ? 's' : ''}{' '}
										already have prizes assigned
									</li>
								)}
							</ul>
							<div className='mt-2 text-sm'>
								Please deselect these codes and try again.
							</div>
						</AlertDescription>
					</Alert>
				)}
				<DialogFooter>
					<Button
						type='button'
						variant='outline'
						onClick={handleClose}
						disabled={isAssigning}
					>
						Cancel
					</Button>
					<Button
						type='button'
						onClick={handleAssignPrize}
						disabled={
							!validationResult.isValid || !selectedPrizeId || isAssigning
						}
					>
						{isAssigning ? 'Assigning...' : 'Assign'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
