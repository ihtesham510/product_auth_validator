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
		<div className='flex items-center justify-center h-screen w-full'>
			<div>
				{hasPrize ? (
					<div>
						Congratulation you've won {prizeName}, {prizeDescription}
					</div>
				) : (
					<div>better luck next time</div>
				)}
				{encryptedId && requires_cnic && (
					<Link to='/upload/$id' params={{ id: encryptedId }}>
						<Button>Upload</Button>
					</Link>
				)}
			</div>
		</div>
	)
}
