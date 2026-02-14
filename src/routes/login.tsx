import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'

const loginSchema = z.object({
	username: z.string().min(1, 'Username is required'),
	password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export const Route = createFileRoute('/login')({
	component: LoginPage,
	beforeLoad({ context }) {
		if (context.isAuthenticated) {
			throw redirect({
				to: '/admin',
			})
		}
	},
})

function LoginPage() {
	const { login } = useAuth()
	const navigate = useNavigate()

	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			username: '',
			password: '',
		},
	})
	const onSubmit = async (values: LoginFormValues) => {
		const res = await login(values.username, values.password)
		if (res === 'Invalid username or password') {
			toast.error(res)
			form.setError('username', {
				type: 'manual',
				message: 'Invalid username or password',
			})
		} else {
			navigate({ to: '/' })
			toast.success('Logged In')
		}
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-100 px-4'>
			<Card className='w-full max-w-md'>
				<CardHeader className='space-y-1'>
					<CardTitle className='text-2xl font-bold text-center'>
						Login
					</CardTitle>
					<CardDescription className='text-center'>
						Enter your credentials to access the application
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
							{form.formState.errors.root && (
								<div className='p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md'>
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
												placeholder='Enter username'
												disabled={form.formState.isSubmitting}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='password'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input
												type='password'
												placeholder='Enter password'
												disabled={form.formState.isSubmitting}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button
								type='submit'
								className='w-full'
								disabled={form.formState.isSubmitting}
							>
								{form.formState.isSubmitting ? 'Logging in...' : 'Login'}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	)
}
