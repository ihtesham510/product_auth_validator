import { zodResolver } from '@hookform/resolvers/zod'
import { useLocalStorage } from '@mantine/hooks'
import { Link } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useAction, useMutation } from 'convex/react'
import { AlertCircle, CheckCircle2, Gift, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from '@/components/ui/dialog'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { PhoneInput } from './ui/phone-input'

const verificationSchema = z.object({
	code: z.string().min(1, 'Code is required'),
	name: z.string().min(1, 'Name is required'),
	phone: z.string().min(1, 'Phone number is required'),
})

type VerificationFormValues = z.infer<typeof verificationSchema>

export function VerificationForm() {
	const verifyCode = useMutation(api.codes.verifyCode)
	const enterClaimablePrize = useMutation(api.prizes.enterClaimablePrize)
	const [dialogData, setDialogData] = useLocalStorage<{
		type: 'success' | 'error'
		title: string
		message: string
		details?: { name: string; phone: string }
		isValid?: boolean
		prize?: {
			name: string
			description: string
			requires_cnic: boolean
		} | null
		uploadId?: string
		hasPrize?: boolean
	} | null>({
		key: 'prize data',
		defaultValue: null,
	})

	const [dialogOpen, setDialogOpen] = useState(false)
	const encrypt = useAction(api.node.encrypt)

	const form = useForm<VerificationFormValues>({
		resolver: zodResolver(verificationSchema),
		defaultValues: {
			code: '',
			name: '',
			phone: '',
		},
	})

	useEffect(() => {
		if (dialogData) setDialogOpen(true)
	}, [dialogData])

	useEffect(() => {
		if (!dialogOpen) {
			setDialogData(null)
			form.reset()
		}
	}, [dialogOpen, form, setDialogData])

	const onSubmit = async (values: VerificationFormValues) => {
		const res = await verifyCode({
			name: values.name.trim(),
			code: values.code.trim(),
			phone: values.phone.trim(),
		})
		if (!res.prize_info?.requires_cnic && res.id) {
			await enterClaimablePrize({
				verified_code_id: res.id,
			})
		}

		if (res.success) {
			setDialogData({
				type: 'success',
				title: res.isValid
					? 'Product Is Original'
					: 'Product Is Genuine (Already Used)',
				message: res.message || 'The Code is Valid',
				details: {
					name: values.name.trim(),
					phone: values.phone.trim(),
				},
				uploadId:
					res.id && !res.prizeClaimed
						? await encrypt({ id: res.id })
						: undefined,
				isValid: res.isValid,
				prize: res.prize_info
					? {
							name: res.prize_info.prize_name,
							description: res.prize_info.description,
							requires_cnic: res.prize_info.requires_cnic,
						}
					: null,
				hasPrize: res.hasPrize || false,
			})
		} else {
			setDialogData({
				message:
					res.message ||
					'Invalid code. This code does not exist in our system.',
				title: 'Product Is Not Valid',
				type: 'error',
			})
		}
		setDialogOpen(true)
	}

	return (
		<Card className='w-full max-w-md'>
			<CardHeader className='space-y-1'>
				<CardTitle className='text-2xl font-bold text-center'>
					Verify Product Code
				</CardTitle>
				<CardDescription className='text-center'>
					Enter your scratchable code and details to verify your product
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						{form.formState.errors.root && (
							<div className='p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2'>
								<XCircle className='h-4 w-4' />
								{form.formState.errors.root.message}
							</div>
						)}

						<FormField
							control={form.control}
							name='code'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Product Code</FormLabel>
									<FormControl>
										<Input
											placeholder='Enter scratchable code'
											disabled={form.formState.isSubmitting}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Enter the code from your product
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Your Name</FormLabel>
									<FormControl>
										<Input
											placeholder='Enter your name'
											disabled={form.formState.isSubmitting}
											{...field}
										/>
									</FormControl>
									<FormDescription>Enter your full name</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='phone'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Phone Number</FormLabel>
									<FormControl>
										<PhoneInput
											defaultCountry='PK'
											placeholder='Enter your phone number'
											disabled={form.formState.isSubmitting}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Enter your contact phone number
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							type='submit'
							className='w-full'
							disabled={form.formState.isSubmitting}
						>
							{form.formState.isSubmitting ? 'Verifying...' : 'Verify Code'}
						</Button>
					</form>
				</Form>
			</CardContent>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className='pt-10'>
					<DialogHeader>
						{dialogData?.type === 'success' ? (
							<Alert
								className={
									dialogData.isValid === false
										? 'bg-yellow-50 border-yellow-200'
										: 'bg-green-400'
								}
							>
								<CheckCircle2
									className={`h-6 w-6 ${dialogData.isValid === false ? 'text-yellow-600' : 'text-green-600'}`}
								/>
								<AlertTitle>{dialogData?.title}</AlertTitle>
								<AlertDescription>{dialogData?.message}</AlertDescription>
							</Alert>
						) : (
							<Alert className='bg-red-400'>
								<AlertCircle className='h-6 w-6 text-red-600' />
								<AlertTitle>The Product Code is not valid.</AlertTitle>
								<AlertDescription>{dialogData?.message}</AlertDescription>
							</Alert>
						)}
					</DialogHeader>

					{dialogData?.hasPrize && dialogData?.prize && dialogData.uploadId && (
						<Alert className='bg-purple-50 border-purple-200'>
							<Gift className='h-6 w-6 text-purple-600' />
							<AlertTitle className='text-purple-800'>
								Congratulations! You Won a Prize!
							</AlertTitle>
							<AlertDescription className='text-purple-700'>
								<div className='mt-2 space-y-1'>
									{dialogData.prize && (
										<div className='text-sm'>
											Congratulations You've Won {dialogData.prize.name}.
											{dialogData.prize.description}
										</div>
									)}
								</div>
								{dialogData.prize.requires_cnic && (
									<Link to='/upload/$id' params={{ id: dialogData.uploadId }}>
										<Button>Upload</Button>
									</Link>
								)}
							</AlertDescription>
						</Alert>
					)}

					{dialogData?.details && dialogData?.isValid === true && (
						<div className='py-4 space-y-2'>
							<div className='text-sm font-medium text-gray-700'>
								Verified Details:
							</div>
							<div className='space-y-1 text-sm text-gray-600'>
								<div>
									<span className='font-medium'>Name:</span>{' '}
									{dialogData.details.name}
								</div>
								<div>
									<span className='font-medium'>Phone:</span>{' '}
									{dialogData.details.phone}
								</div>
							</div>
						</div>
					)}

					{dialogData?.isValid === false && (
						<Alert className='bg-blue-50 border-blue-200'>
							<AlertCircle className='h-5 w-5 text-blue-600' />
							<AlertDescription className='text-blue-700 text-sm'>
								Note: This product code is genuine and authentic, but it has
								already been verified previously.
							</AlertDescription>
						</Alert>
					)}

					<DialogFooter>
						<Button onClick={() => setDialogOpen(false)}>Close</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	)
}
