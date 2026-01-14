import { zodResolver } from '@hookform/resolvers/zod'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { useMutation, useQuery } from 'convex/react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
	Field,
	FieldContent,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Form, FormControl, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from './ui/checkbox'

const editCodeSchema = z.object({
	code: z.string().min(4, 'Code is required'),
	isValid: z.boolean(),
})

type EditCodeFormValues = z.infer<typeof editCodeSchema>

interface EditCodeFormProps {
	codeId: Id<'codes'>
	onSuccess?: () => void
}

export function EditCodeForm({ codeId, onSuccess }: EditCodeFormProps) {
	const updateCode = useMutation(api.codes.updateCode)
	const currentCode = useQuery(api.codes.getCode, { id: codeId })

	const form = useForm<EditCodeFormValues>({
		resolver: zodResolver(editCodeSchema),
		defaultValues: {
			code: currentCode?.code ?? undefined,
			isValid: currentCode?.isValid,
		},
	})

	useEffect(() => {
		form.reset({
			code: currentCode?.code ?? undefined,
			isValid: currentCode?.isValid,
		})
	}, [currentCode, form.reset])

	const onSubmit = async (values: EditCodeFormValues) => {
		try {
			await updateCode({
				code_id: codeId,
				code: values.code.trim(),
				isValid: values.isValid,
			})
			form.reset()
			onSuccess?.()
		} catch (err) {
			form.setError('root', {
				type: 'manual',
				message:
					err instanceof Error
						? err.message
						: 'Failed to update code. Please try again.',
			})
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
				{form.formState.errors.root && (
					<div className='p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md'>
						{form.formState.errors.root.message}
					</div>
				)}
				<FieldGroup>
					<FormField
						control={form.control}
						name='code'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel>Code</FieldLabel>
								<FieldContent>
									<FormControl>
										<Input
											placeholder='Enter code'
											disabled={form.formState.isSubmitting}
											{...field}
										/>
									</FormControl>
									<FieldError
										errors={fieldState.error ? [fieldState.error] : []}
									/>
								</FieldContent>
							</Field>
						)}
					/>
					<FormField
						control={form.control}
						name='isValid'
						render={({ field, fieldState }) => (
							<Field orientation='horizontal' data-invalid={fieldState.invalid}>
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
										disabled={form.formState.isSubmitting}
									/>
								</FormControl>
								<FieldLabel>Code is Valid</FieldLabel>
								<FieldError
									errors={fieldState.error ? [fieldState.error] : []}
								/>
							</Field>
						)}
					/>
				</FieldGroup>
				<div className='flex gap-2 justify-end'>
					<Button type='submit' disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting ? 'Updating...' : 'Update Code'}
					</Button>
				</div>
			</form>
		</Form>
	)
}
