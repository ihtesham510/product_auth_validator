import { createFileRoute, Link } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { useAction, useMutation } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/verified/$verified_code')({
	component: RouteComponent,
})

function RouteComponent() {
	const { verified_code } = Route.useParams()
	const enterClaimablePrize = useMutation(api.prizes.enterClaimablePrize)
	const code = useQuery(api.codes.getVerifiedCode, {
		verified_code: verified_code as Id<'verified_codes'>,
	})
	const [encryptedId, setEncryptedId] = useState<string>()
	const requires_cnic = code?.prize?.prize_definition_id.requires_cnic
	const hasPrize = !!code?.prize
	const prizeName = code?.prize?.prize_definition_id.prize_name
	const prizeDescription = code?.prize?.prize_definition_id.description
	const encrypt = useAction(api.node.encrypt)
	useEffect(() => {
		;(async () => {
			if (code?._id) {
				const res = await encrypt({ id: code._id })
				setEncryptedId(res)
			}
		})()
	}, [encrypt, code?._id])

	useEffect(() => {
		if (code) {
			;(async () => {
				if (!requires_cnic) {
					await enterClaimablePrize({
						verified_code_id: code?._id,
					})
				}
			})()
		}
	}, [requires_cnic, code, enterClaimablePrize])
	if (typeof code === 'undefined') {
		return (
			<div className='flex items-center justify-center h-screen w-full'>
				<Spinner className='size-12' />
			</div>
		)
	}

	if (!code) {
		return (
			<div className='flex items-center justify-center h-screen w-full'>
				<div className='flex flex-col text-center gap-6'>
					<h1 className='text-8xl font-bold'>404</h1>
					<p>Error: Code not found</p>
				</div>
			</div>
		)
	}
	return (
		<div className='flex items-center justify-center min-h-screen w-full bg-linear-to-br from-blue-50 to-indigo-100 p-4'>
			<div className='flex flex-col items-center justify-center max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 space-y-6'>
				{/* Valid Code Badge */}
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

				{/* Emoji Icon */}
				<div className='w-32 h-32 md:w-40 md:h-40'>
					{hasPrize ? (
						<img
							src='/happy_emoji.svg'
							alt='Happy face'
							className='w-full h-full animate-bounce'
						/>
					) : (
						<img
							src='/sad_emoji.svg'
							alt='Sad face'
							className='w-full h-full'
						/>
					)}
				</div>

				{/* Message */}
				<div className='text-center space-y-3'>
					{hasPrize ? (
						<>
							<h1 className='text-3xl md:text-4xl font-bold text-green-600'>
								🎉 Congratulations! 🎉
							</h1>
							<p className='text-xl md:text-2xl font-semibold text-gray-800'>
								You've won {prizeName}!
							</p>
							{prizeDescription && (
								<p className='text-base md:text-lg text-gray-600 mt-2'>
									{prizeDescription}
								</p>
							)}
						</>
					) : (
						<>
							<h1 className='text-3xl md:text-4xl font-bold text-gray-700'>
								No Prize Won
							</h1>
							<p className='text-xl md:text-2xl font-semibold text-gray-600'>
								Better Luck Next Time
							</p>
							<p className='text-base md:text-lg text-gray-500'>
								Don't give up! Try again for another chance to win.
							</p>
						</>
					)}
				</div>

				{/* Upload Button */}
				{encryptedId && requires_cnic && (
					<Link
						to='/upload/$id'
						params={{ id: encryptedId }}
						className='w-full'
					>
						<Button className='w-full text-lg py-6 bg-indigo-600 hover:bg-indigo-700 transition-colors'>
							Upload CNIC to Claim Prize
						</Button>
					</Link>
				)}
			</div>
		</div>
	)
}
