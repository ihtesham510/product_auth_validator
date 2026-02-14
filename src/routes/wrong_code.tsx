import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/wrong_code')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div className='flex items-center justify-center min-h-screen w-full bg-linear-to-br from-red-50 to-orange-100 p-4'>
			<div className='flex flex-col items-center justify-center max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 space-y-6'>
				{/* Invalid Code Badge */}
				<div className='bg-red-100 border-2 border-red-500 rounded-full px-6 py-2 flex items-center gap-2'>
					<svg
						className='w-6 h-6 text-red-600'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<title> Invalid Code Badge</title>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M6 18L18 6M6 6l12 12'
						/>
					</svg>
					<span className='text-red-700 font-semibold text-lg'>
						Invalid Code
					</span>
				</div>

				{/* Error Icon */}
				<div className='w-32 h-32 md:w-40 md:h-40 flex items-center justify-center'>
					<svg
						className='w-full h-full text-red-500'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<title>Error icon</title>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={1.5}
							d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
						/>
					</svg>
				</div>

				{/* Message */}
				<div className='text-center space-y-3'>
					<h1 className='text-3xl md:text-4xl font-bold text-red-600'>
						Code Not Valid
					</h1>
					<p className='text-xl md:text-2xl font-semibold text-gray-700'>
						The code you entered is incorrect or has expired
					</p>
					<p className='text-base md:text-lg text-gray-600'>
						Please check your code and try again, or contact support if you
						believe this is an error.
					</p>
				</div>

				{/* Action Button */}
				<Link to='/' className='w-full'>
					<Button className='w-full text-lg py-6 bg-red-600 hover:bg-red-700 transition-colors'>
						Try Again
					</Button>
				</Link>
			</div>
		</div>
	)
}
