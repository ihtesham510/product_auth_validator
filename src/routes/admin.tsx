import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import { useEffect } from 'react'
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
import { PasswordInput } from '@/components/ui/password-input'

const adminCredentialsSchema = z
	.object({
		username: z.string().min(1, 'Username is required'),
		password: z.string().min(1, 'Password is required'),
		confirmPassword: z.string().min(1, 'Please confirm your password'),
	})
	.refine(data => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	})

type AdminCredentialsFormValues = z.infer<typeof adminCredentialsSchema>

export const Route = createFileRoute('/admin')({
	component: AdminPage,
	loader({ context }) {
		if (!context.isAuthenticated) {
			throw redirect({
				to: '/login',
			})
		}
	},
})

function AdminPage() {
	const currentCredentials = useQuery(api.auth.getAdminCredentials)
	const updateCredentials = useMutation(api.auth.updateAdminCredentials)

	const form = useForm<AdminCredentialsFormValues>({
		resolver: zodResolver(adminCredentialsSchema),
		defaultValues: {
			username: '',
			password: '',
			confirmPassword: '',
		},
	})

	useEffect(() => {
		if (currentCredentials?.username) {
			form.reset({
				username: currentCredentials.username,
				password: '',
				confirmPassword: '',
			})
		}
	}, [currentCredentials, form])

	const onSubmit = async (values: AdminCredentialsFormValues) => {
		try {
			await updateCredentials({
				username: values.username.trim(),
				password: values.password.trim(),
			})

			// Reset password fields after successful update
			form.reset({
				username: values.username.trim(),
				password: '',
				confirmPassword: '',
			})

			// Show success message
			form.setError('root', {
				type: 'manual',
				message: 'Credentials updated successfully!',
			})

			// Clear success message after 3 seconds
			setTimeout(() => {
				form.clearErrors('root')
			}, 3000)
		} catch (err) {
			form.setError('root', {
				type: 'manual',
				message:
					err instanceof Error
						? err.message
						: 'Failed to update credentials. Please try again.',
			})
		}
	}

	return (
		<div className='min-h-screen bg-gray-100 px-4 py-8'>
			<div className='max-w-7xl mx-auto space-y-6'>
				{/* Admin Credentials Card */}
				<Card className='w-full max-w-md mx-auto'>
					<CardHeader className='space-y-1'>
						<CardTitle className='text-2xl font-bold text-center'>
							Admin Settings
						</CardTitle>
						<CardDescription className='text-center'>
							Change login username and password
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className='space-y-4'
							>
								{form.formState.errors.root && (
									<div
										className={`p-3 text-sm rounded-md border ${
											form.formState.errors.root.message?.includes(
												'successfully',
											)
												? 'text-green-600 bg-green-50 border-green-200'
												: 'text-red-600 bg-red-50 border-red-200'
										}`}
									>
										{form.formState.errors.root.message}
									</div>
								)}
								<FormField
									control={form.control}
									name='username'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Username</FormLabel>
											<FormControl>
												<Input
													placeholder='Enter new username'
													disabled={form.formState.isSubmitting}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<fieldset className='space-y-4 border border-border rounded-md p-4'>
									<legend className='text-sm font-medium text-foreground px-2'>
										Password Settings
									</legend>
									<FormField
										control={form.control}
										name='password'
										render={({ field }) => (
											<FormItem>
												<FormLabel>New Password</FormLabel>
												<FormControl>
													<PasswordInput
														placeholder='Enter new password'
														disabled={form.formState.isSubmitting}
														{...field}
													/>
												</FormControl>
												<FormDescription>
													Choose a strong password for your account
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name='confirmPassword'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Confirm Password</FormLabel>
												<FormControl>
													<PasswordInput
														placeholder='Confirm new password'
														disabled={form.formState.isSubmitting}
														{...field}
													/>
												</FormControl>
												<FormDescription>
													Re-enter your password to confirm
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</fieldset>
								<Button
									type='submit'
									className='w-full'
									disabled={form.formState.isSubmitting}
								>
									{form.formState.isSubmitting
										? 'Updating...'
										: 'Update Credentials'}
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
