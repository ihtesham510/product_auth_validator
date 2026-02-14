import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useMutation } from 'convex/react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
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
	const [currentStep, setCurrentStep] = useState(1)
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

	const validateStep = async (step: number): Promise<boolean> => {
		let isValid = false

		switch (step) {
			case 1:
				isValid = await form.trigger('name')
				break
			case 2:
				isValid = await form.trigger('phone')
				break
			case 3:
				isValid = await form.trigger('code')
				break
			default:
				isValid = false
		}

		return isValid
	}

	const handleNext = async () => {
		const isValid = await validateStep(currentStep)
		if (isValid) {
			setCurrentStep(prev => Math.min(prev + 1, 3))
		}
	}

	const handleBack = () => {
		setCurrentStep(prev => Math.max(prev - 1, 1))
	}

	return (
		<Card className='w-full max-w-2xl'>
			<CardHeader className='space-y-1'>
				<CardTitle className='text-2xl font-bold text-center'>
					Verify Product Code
				</CardTitle>
				<CardDescription className='text-center'>
					Complete the steps below to verify your product
				</CardDescription>
			</CardHeader>

			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
						{/* Step 1: Name */}
						{currentStep === 1 && (
							<div className='space-y-4 animate-in fade-in slide-in-from-right-4 duration-300'>
								<div className='text-center mb-6'>
									<h3 className='text-lg font-semibold text-gray-900'>
										What's your name?
									</h3>
									<p className='text-sm text-gray-600 mt-1'>
										Please enter your full name
									</p>
								</div>
								<FormField
									control={form.control}
									name='name'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Full Name</FormLabel>
											<FormControl>
												<Input
													placeholder='John Doe'
													className='text-lg py-6'
													autoFocus
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
							</div>
						)}

						{/* Step 2: Phone */}
						{currentStep === 2 && (
							<div className='space-y-4 animate-in fade-in slide-in-from-right-4 duration-300'>
								<div className='text-center mb-6'>
									<h3 className='text-lg font-semibold text-gray-900'>
										What's your phone number?
									</h3>
									<p className='text-sm text-gray-600 mt-1'>
										We'll use this to contact you about your verification
									</p>
								</div>
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
							</div>
						)}

						{/* Step 3: Code */}
						{currentStep === 3 && (
							<div className='space-y-4 animate-in fade-in slide-in-from-right-4 duration-300'>
								<div className='text-center mb-6'>
									<h3 className='text-lg font-semibold text-gray-900'>
										Enter your verification code
									</h3>
									<p className='text-sm text-gray-600 mt-1'>
										Scratch the card to reveal your unique code
									</p>
								</div>
								<FormField
									control={form.control}
									name='code'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Product Code</FormLabel>
											<FormControl>
												<Input
													placeholder='Enter code from product'
													className='text-lg py-6 tracking-wider font-mono'
													autoFocus
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Enter the code exactly as shown on your product
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}

						{/* Navigation Buttons */}
						<div className='flex gap-3 pt-4'>
							{currentStep > 1 && (
								<Button
									type='button'
									variant='outline'
									onClick={handleBack}
									className='flex-1'
								>
									<ArrowLeft className='w-4 h-4 mr-2' />
									Back
								</Button>
							)}

							{currentStep < 3 ? (
								<Button type='button' onClick={handleNext} className='flex-1'>
									Next
									<ArrowRight className='w-4 h-4 ml-2' />
								</Button>
							) : (
								<Button
									type='submit'
									className='flex-1'
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
							)}
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	)
}
