import { createFileRoute, redirect } from '@tanstack/react-router'
import type { Row } from '@tanstack/react-table'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { useQuery as useConvexQuery, useMutation } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache'
import {
	Check,
	CheckCircle2,
	ChevronsUpDown,
	DownloadIcon,
	Ellipsis,
	PencilIcon,
	Trash2,
	TrashIcon,
	Trophy,
	XCircle,
} from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { EditCodeForm } from '@/components/EditCodeForm'
import { ImportCodes } from '@/components/ImportCodes'
import { PrizeAssignmentDialog } from '@/components/PrizeAssignmentDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/codes')({
	component: CodesPage,
	loader({ context }) {
		if (!context.isAuthenticated) {
			throw redirect({
				to: '/login',
			})
		}
	},
})

type Code = (typeof api.codes.getAllCodes)['_returnType'][0]

function CodesPage() {
	const codes = useQuery(api.codes.getAllCodes, {})
	const deleteCodes = useMutation(api.codes.deleteCodes)
	const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
	const [importDialog, setImportDialog] = useState(false)

	if (codes === undefined) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<Spinner />
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-100 px-4 py-8'>
			<div className='max-w-7xl mx-auto'>
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<div>
								<CardTitle className='text-2xl font-bold'>All Codes</CardTitle>
								<CardDescription>
									View all product codes and their status
								</CardDescription>
							</div>
							<div className='flex items-center gap-2'>
								<Button onClick={() => setAssignmentDialogOpen(true)}>
									<Trophy className='h-4 w-4 mr-2' />
									<p className='hidden md:inline-flex'>Assign Prize</p>
								</Button>
								<Button onClick={() => setImportDialog(true)}>
									<DownloadIcon className='h-4 w-4 mr-2' />
									<p className='hidden md:inline-flex'>Import Codes</p>
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{codes.length === 0 ? (
							<div className='text-center py-8 text-gray-500'>
								No codes found. Import codes to get started.
							</div>
						) : (
							<DataTable
								data={codes}
								filterColumn='code'
								SelectedRowContent={props => {
									return (
										<Button
											variant='destructive'
											onClick={async () => {
												await deleteCodes({
													ids: props.rows.map(row => row.getValue('id')),
												})
												props.table.resetRowSelection()
											}}
										>
											<TrashIcon />
										</Button>
									)
								}}
								columns={[
									{
										id: 'select',
										header: ({ table }) => (
											<Checkbox
												checked={
													table.getIsAllPageRowsSelected() ||
													(table.getIsSomeRowsSelected() && 'indeterminate')
												}
												onCheckedChange={value =>
													table.toggleAllRowsSelected(!!value)
												}
												aria-label='Select all'
											/>
										),
										cell: ({ row }) => (
											<Checkbox
												checked={row.getIsSelected()}
												onCheckedChange={value => row.toggleSelected(!!value)}
												aria-label='Select row'
											/>
										),
									},
									{
										accessorKey: 'code',
										header: 'Code',
										cell: ({ row }) => <div>{row.getValue('code')}</div>,
									},
									{
										accessorKey: 'verifiedDetails',
										header: 'Verified',
										cell: ({ row }) => {
											const details = row.original.verifiedDetails
											return (
												<div>
													{row.original.verified ? (
														<div className='text-sm'>
															<div className='font-medium'>{details?.name}</div>
															<div className='text-gray-500'>
																{details?.phone}
															</div>
														</div>
													) : (
														<span className='text-gray-400'>Not verified</span>
													)}
												</div>
											)
										},
									},
									{
										accessorKey: 'isValid',
										header: 'Valid',
										cell: ({ row }) => (
											<React.Fragment>
												{row.getValue('isValid') ? (
													<Badge variant='default' className='bg-green-500'>
														<CheckCircle2 className='h-3 w-3 mr-1' />
														Valid
													</Badge>
												) : (
													<Badge variant='destructive'>
														<XCircle className='h-3 w-3 mr-1' />
														Used
													</Badge>
												)}
											</React.Fragment>
										),
									},
									{
										accessorKey: 'prizeName',
										header: 'Prize',
										cell: ({ row }) => (
											<React.Fragment>
												{row.getValue('prizeName') ? (
													<Badge variant='outline' className='bg-yellow-50'>
														<Trophy className='h-3 w-3 mr-1' />
														{row.getValue('prizeName')}
													</Badge>
												) : (
													<span className='text-gray-400'>No prize</span>
												)}
											</React.Fragment>
										),
									},
									{
										accessorKey: 'id',
										header: 'Actions',
										cell: ({ row }) => <ActionsCell row={row} />,
									},
								]}
							/>
						)}
					</CardContent>
				</Card>
				<PrizeAssignmentDialog
					open={assignmentDialogOpen}
					onOpenChange={setAssignmentDialogOpen}
				/>
				<Dialog open={importDialog} onOpenChange={e => setImportDialog(e)}>
					<DialogContent className='min-w-max p-12'>
						<ImportCodes />
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}

function ActionsCell({ row }: { row: Row<Code> }) {
	const deleteCodes = useMutation(api.codes.deleteCodes)
	const assignPrizeToCode = useMutation(api.prizes.assignPrizeToCode)
	const removePrizeFromCode = useMutation(api.prizes.removePrizeFromCode)
	const prizeDefinitions = useConvexQuery(api.prizes.getAllPrizeDefinitions)

	const [edit, setEdit] = useState(false)
	const [open, setIsOpen] = useState(false)
	const [selectedPrizeId, setSelectedPrizeId] =
		useState<Id<'prize_definitions'>>()
	const codeId = row.getValue('id') as Id<'codes'>
	const currentPrizeName = row.getValue('prizeName') as string | null

	const currentPrizeDef = prizeDefinitions?.find(
		pd => pd.prize_name === currentPrizeName,
	)
	const currentValue = currentPrizeDef?._id || selectedPrizeId || ''

	const handleAssignPrize = async (
		prizeDefinitionId: Id<'prize_definitions'>,
	) => {
		try {
			await assignPrizeToCode({
				code_id: codeId,
				prize_definition_id: prizeDefinitionId,
			})
			setSelectedPrizeId(prizeDefinitionId)
			toast.success('Prize assigned successfully!')
			setIsOpen(false)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to assign prize')
		}
	}

	const handleRemovePrize = async () => {
		try {
			await removePrizeFromCode({ code_id: codeId })
			setSelectedPrizeId(undefined)
			toast.success('Prize removed successfully!')
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to remove prize')
		}
	}

	const selectedPrize = prizeDefinitions?.find(pd => pd._id === currentValue)

	return (
		<React.Fragment>
			<Dialog open={open} onOpenChange={setIsOpen}>
				<DialogContent>
					<FieldGroup>
						<Field>
							<FieldLabel>Select Prize</FieldLabel>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										role='combobox'
										aria-expanded={open}
										className='justify-between min-w-[300px]'
									>
										{selectedPrize
											? selectedPrize.prize_name
											: 'Select prize...'}
										<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-[300px] p-0'>
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
															if (currentValue === prize._id) {
																handleRemovePrize()
																setIsOpen(false)
															} else {
																handleAssignPrize(prize._id)
															}
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
																currentValue === prize._id
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
						</Field>
					</FieldGroup>
				</DialogContent>
			</Dialog>
			<Dialog open={edit} onOpenChange={setEdit}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Update Code</DialogTitle>
					</DialogHeader>
					<EditCodeForm codeId={codeId} />
				</DialogContent>
			</Dialog>
			<DropdownMenu>
				<DropdownMenuTrigger>
					<Button size='icon-sm' variant='ghost'>
						<Ellipsis />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem
						onClick={() => setIsOpen(true)}
						className='flex justify-between items-center'
					>
						Add Prize <Trophy />
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => setEdit(true)}
						className='flex justify-between items-center'
					>
						Edit <PencilIcon />
					</DropdownMenuItem>
					<DropdownMenuItem
						className='flex justify-between items-center'
						onClick={async () =>
							await deleteCodes({
								ids: [codeId],
							})
						}
					>
						Delete <Trash2 />
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</React.Fragment>
	)
}
