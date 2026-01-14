import { zodResolver } from '@hookform/resolvers/zod'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { useMutation, useQuery } from 'convex/react'
import { Check, ChevronsUpDown, Trophy } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
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
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const prizeAssignmentSchema = z.object({
	code_id: z.string().min(1, 'Code is required'),
	prize_definition_id: z.string().min(1, 'Prize definition is required'),
})

type PrizeAssignmentFormValues = z.infer<typeof prizeAssignmentSchema>

interface PrizeAssignmentDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function PrizeAssignmentDialog({
	open,
	onOpenChange,
}: PrizeAssignmentDialogProps) {
	const allCodes = useQuery(api.codes.getAllCodes, {})
	const prizeDefinitions = useQuery(api.prizes.getAllPrizeDefinitions)
	const assignPrizeToCode = useMutation(api.prizes.assignPrizeToCode)

	const [codeComboboxOpen, setCodeComboboxOpen] = useState(false)
	const [prizeComboboxOpen, setPrizeComboboxOpen] = useState(false)

	const assignmentForm = useForm<PrizeAssignmentFormValues>({
		resolver: zodResolver(prizeAssignmentSchema),
		defaultValues: {
			code_id: '',
			prize_definition_id: '',
		},
	})

	const selectedCodeId = assignmentForm.watch('code_id')
	const selectedPrizeId = assignmentForm.watch('prize_definition_id')

	const selectedCode = allCodes?.find(c => c.id === selectedCodeId)
	const selectedPrize = prizeDefinitions?.find(p => p._id === selectedPrizeId)

	const handleAssignPrize = async (values: PrizeAssignmentFormValues) => {
		try {
			await assignPrizeToCode({
				code_id: values.code_id as Id<'codes'>,
				prize_definition_id:
					values.prize_definition_id as Id<'prize_definitions'>,
			})
			toast.success('Prize assigned successfully!')
			assignmentForm.reset()
			onOpenChange(false)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to assign prize')
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Assign Prize to Code</DialogTitle>
					<DialogDescription>
						Select a code and assign a prize definition to it
					</DialogDescription>
				</DialogHeader>
				<Form {...assignmentForm}>
					<form
						onSubmit={assignmentForm.handleSubmit(handleAssignPrize)}
						className='space-y-4'
					>
						<FormField
							control={assignmentForm.control}
							name='code_id'
							render={({ field }) => (
								<FormItem className='flex flex-col'>
									<FormLabel>Code</FormLabel>
									<Popover
										open={codeComboboxOpen}
										onOpenChange={setCodeComboboxOpen}
									>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant='outline'
													role='combobox'
													aria-expanded={codeComboboxOpen}
													className='w-full justify-between'
												>
													{selectedCode ? selectedCode.code : 'Select code...'}
													<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className='w-full p-0'>
											<Command>
												<CommandInput
													placeholder='Search codes...'
													className='h-9'
												/>
												<CommandList>
													<CommandEmpty>No code found.</CommandEmpty>
													<CommandGroup>
														{allCodes?.map(code => (
															<CommandItem
																key={code.id}
																value={code.code}
																onSelect={() => {
																	field.onChange(code.id)
																	setCodeComboboxOpen(false)
																}}
															>
																<div className='flex flex-col flex-1'>
																	<span className='font-mono font-medium'>
																		{code.code}
																	</span>
																	<span className='text-xs text-gray-500'>
																		{code.isValid ? 'Valid' : 'Used'}
																	</span>
																</div>
																<Check
																	className={cn(
																		'ml-auto h-4 w-4',
																		selectedCodeId === code.id
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
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={assignmentForm.control}
							name='prize_definition_id'
							render={({ field }) => (
								<FormItem className='flex flex-col'>
									<FormLabel>Prize Definition</FormLabel>
									<Popover
										open={prizeComboboxOpen}
										onOpenChange={setPrizeComboboxOpen}
									>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant='outline'
													role='combobox'
													aria-expanded={prizeComboboxOpen}
													className='w-full justify-between'
												>
													{selectedPrize
														? selectedPrize.prize_name
														: 'Select prize...'}
													<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
												</Button>
											</FormControl>
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
																	field.onChange(prize._id)
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
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => {
									onOpenChange(false)
									assignmentForm.reset()
								}}
							>
								Cancel
							</Button>
							<Button type='submit'>Assign</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
