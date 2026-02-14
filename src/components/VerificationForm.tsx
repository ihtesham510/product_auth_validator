import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useMutation } from 'convex/react'
import { XCircle } from 'lucide-react'
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
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PhoneInput } from './ui/phone-input'

const verificationSchema = z.object({
	code: z.string().min(1, 'Code is required'),
	name: z.string().min(1, 'Name is required'),
	phone: z.string().min(1, 'Phone number is required'),
})

type VerificationFormValues = z.infer<typeof verificationSchema>

export function VerificationForm() {
	const verifyCode = useMutation(api.codes.verifyCode)
	const router = useRouter()

	const form = useForm<VerificationFormValues>({
		resolver: zodResolver(verificationSchema),
		defaultValues: {
			code: '',
			name: '',
			phone: '',
		},
	})
	const onSubmit = async (values: VerificationFormValues) => {
		const res = await verifyCode({
			name: values.name.trim(),
			code: values.code.trim(),
			phone: values.phone.trim(),
		})

		if (res.success && res.id) {
			router.navigate({
				to: '/verified/$verified_code',
				params: {
					verified_code: res.id,
				},
			})
		} else {
			router.navigate({
				to: '/wrong_code',
			})
		}
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
		</Card>
	)
}
