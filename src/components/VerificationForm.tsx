import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useMutation } from 'convex/react'
import { Check } from 'lucide-react'
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
import { PhoneInput } from '@/components/ui/phone-input'

const verificationSchema = z.object({
	name: z
		.string()
		.min(1, 'Name is required')
		.min(2, 'Name must be at least 2 characters')
		.max(50, 'Name must be less than 50 characters'),
	phone: z
		.string()
		.min(1, 'Phone number is required')
		.regex(
			/^\+?[0-9]{10,15}$/,
			'Please enter a valid phone number (10-15 digits)',
		),
	code: z
		.string()
		.min(1, 'Code is required')
		.min(3, 'Code must be at least 3 characters'),
})

type VerificationFormValues = z.infer<typeof verificationSchema>

export function VerificationForm() {
	const verifyCode = useMutation(api.codes.verifyCode)
	const router = useRouter()

	const form = useForm<VerificationFormValues>({
		resolver: zodResolver(verificationSchema),
		mode: 'onChange',
		defaultValues: {
			name: '',
			phone: '',
			code: '',
		},
	})

	const onSubmit = async (values: VerificationFormValues) => {
		const res = await verifyCode({
			name: values.name.trim(),
			code: values.code.trim(),
			phone: values.phone.trim(),
		})

		if (res.success && res.id) {
			if (res.already_used) {
				router.navigate({
					to: '/used_code',
				})
			} else {
				router.navigate({
					to: '/verified/$verified_code',
					params: {
						verified_code: res.id,
					},
				})
			}
		} else {
			router.navigate({
				to: '/wrong_code',
			})
		}
	}

	return (
		<Card className='w-full max-w-2xl'>
			<CardHeader className='space-y-1'>
				<CardTitle className='text-2xl font-bold text-center'>
					Verify Product Code
				</CardTitle>
				<CardDescription className='text-center'>
					Enter your details to verify your product
				</CardDescription>
			</CardHeader>

			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
						{/* Name Field */}
						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Full Name</FormLabel>
									<FormControl>
										<Input
											placeholder='John Doe'
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Enter your complete legal name
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Phone Field */}
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
										Include country code (e.g., +92 for Pakistan)
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Code Field */}
						<FormField
							control={form.control}
							name='code'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Product Code</FormLabel>
									<FormControl>
										<Input
											placeholder='Enter code from product'
											className='tracking-wider font-mono'
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Scratch the card to reveal your unique code
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Submit Button */}
						<Button
							type='submit'
							className='w-full'
							disabled={form.formState.isSubmitting}
						>
							{form.formState.isSubmitting ? (
								<>
									<div className='w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin' />
									Verifying...
								</>
							) : (
								<>
									Verify Code
									<Check className='w-4 h-4 ml-2' />
								</>
							)}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	)
}
