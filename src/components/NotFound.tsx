import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Home, AlertCircle } from 'lucide-react'

export function NotFound() {
	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-100 px-4'>
			<Card className='w-full max-w-md'>
				<CardHeader className='space-y-1 text-center'>
					<div className='flex justify-center mb-4'>
						<AlertCircle className='h-16 w-16 text-gray-400' />
					</div>
					<CardTitle className='text-3xl font-bold'>404</CardTitle>
					<CardDescription className='text-lg'>Page Not Found</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<p className='text-center text-gray-600'>
						The page you're looking for doesn't exist or has been moved.
					</p>
					<div className='flex flex-col gap-2'>
						<Link to='/'>
							<Button className='w-full' variant='default'>
								<Home className='mr-2 h-4 w-4' />
								Go to Home
							</Button>
						</Link>
						<Button
							onClick={() => window.history.back()}
							className='w-full'
							variant='outline'
						>
							Go Back
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
