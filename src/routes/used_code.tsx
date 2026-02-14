import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/used_code')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='flex items-center justify-center min-h-screen w-full bg-linear-to-br from-amber-50 to-orange-100 p-4'>
      <div className='flex flex-col items-center justify-center max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 space-y-6'>
        <div className='bg-green-100 border-2 border-green-500 rounded-full px-6 py-2 flex items-center gap-2'>
          <svg
            className='w-6 h-6 text-green-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <title>Valid Code Badge</title>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M5 13l4 4L19 7'
            />
          </svg>
          <span className='text-green-700 font-semibold text-lg'>
            Code Verified Successfully
          </span>
        </div>

        {/* Sad Emoji */}
        <div className='w-24 h-24 md:w-32 md:h-32'>
          <img
            src='/sad_emoji.svg'
            alt='Sad emoji - Code already used'
            className='w-full h-full'
          />
        </div>

        {/* Message */}
        <div className='text-center space-y-3'>
          <h1 className='text-3xl md:text-4xl font-bold text-amber-600'>
            Code Already Redeemed
          </h1>
          <p className='text-xl md:text-2xl font-semibold text-gray-700'>
            This code is valid but has already been used
          </p>
          <p className='text-base md:text-lg text-gray-600'>
            Each verification code can only be used once. If you believe this is
            an error or need assistance, please contact our support team.
          </p>
        </div>

        {/* Action Button */}
        <Link to='/' className='w-full'>
          <Button className='w-full text-lg py-6 bg-amber-600 hover:bg-amber-700 transition-colors'>
            Go Back Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
