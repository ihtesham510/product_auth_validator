import { Check, CopyIcon } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

export function CopyCodeButton({
	code,
	...props
}: { code: string } & React.ComponentProps<'button'>) {
	const [copied, setCopied] = useState(false)

	useEffect(() => {
		if (copied) {
			const timer = setTimeout(() => {
				setCopied(false)
			}, 2000)
			return () => clearTimeout(timer)
		}
	}, [copied])

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code)
			setCopied(true)
			toast.success('Code copied to clipboard!')
		} catch (_err) {
			toast.error('Failed to copy code')
		}
	}

	return (
		<Button
			variant='ghost'
			onClick={handleCopy}
			aria-label='Copy code'
			size='icon-sm'
			className={cn(props.className)}
		>
			{copied ? <Check className='size-3' /> : <CopyIcon className='size-3' />}
		</Button>
	)
}
