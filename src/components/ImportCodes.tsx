import { useState, useRef } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Upload, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

export function ImportCodes() {
	const importCodes = useMutation(api.codes.importCodes)
	const [isImporting, setIsImporting] = useState(false)
	const [importProgress, setImportProgress] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0]
		if (!file) return

		// Validate file type
		const validExtensions = ['.xlsx', '.xls', '.csv']
		const fileExtension = file.name
			.substring(file.name.lastIndexOf('.'))
			.toLowerCase()

		if (!validExtensions.includes(fileExtension)) {
			toast.error('Please upload a valid Excel file (.xlsx, .xls, or .csv)')
			return
		}

		setIsImporting(true)
		setImportProgress('Reading file...')

		try {
			const arrayBuffer = await file.arrayBuffer()
			const workbook = XLSX.read(arrayBuffer, { type: 'array' })

			const firstSheetName = workbook.SheetNames[0]
			const worksheet = workbook.Sheets[firstSheetName]

			const jsonData = XLSX.utils.sheet_to_json(worksheet, {
				header: 1,
				defval: '',
			}) as string[][]

			const codes: string[] = []
			for (let i = 0; i < jsonData.length; i++) {
				const firstCell = jsonData[i][0]
				if (
					firstCell &&
					typeof firstCell === 'string' &&
					firstCell.trim() !== ''
				) {
					if (
						i === 0 &&
						(firstCell.toLowerCase().includes('code') ||
							firstCell.toLowerCase().includes('code'))
					) {
						continue
					}
					codes.push(String(firstCell).trim())
				}
			}

			if (codes.length === 0) {
				toast.error(
					'No codes found in the Excel file. Please check the first column.',
				)
				setIsImporting(false)
				setImportProgress(null)
				return
			}

			setImportProgress(`Found ${codes.length} codes. Importing...`)

			const batchSize = 500
			let totalImported = 0
			let totalSkipped = 0

			for (let i = 0; i < codes.length; i += batchSize) {
				const batch = codes.slice(i, i + batchSize)
				setImportProgress(
					`Importing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(codes.length / batchSize)}...`,
				)

				const result = await importCodes({ codes: batch })
				totalImported += result.imported
				totalSkipped += result.skipped || 0

				if (result.errors && result.errors.length > 0) {
					console.warn('Import errors:', result.errors)
				}
			}

			toast.success(
				`Import completed! ${totalImported} codes imported, ${totalSkipped} skipped.`,
			)
			setImportProgress(null)

			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		} catch (error) {
			console.error('Import error:', error)
			toast.error(
				error instanceof Error
					? error.message
					: 'Failed to import codes. Please try again.',
			)
		} finally {
			setIsImporting(false)
			setImportProgress(null)
		}
	}

	return (
		<Card className='sm:min-w-sm lg:min-w-lg'>
			<CardHeader className='space-y-1'>
				<CardTitle className='text-2xl font-bold text-center'>
					Import Codes
				</CardTitle>
				<CardDescription className='text-center'>
					Upload an Excel file with codes in the first column
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				<div className='flex flex-col items-center gap-4'>
					<input
						ref={fileInputRef}
						type='file'
						accept='.xlsx,.xls,.csv'
						onChange={async e => await handleFileUpload(e)}
						disabled={isImporting}
						className='hidden'
						id='code-file-input'
					/>
					<label
						htmlFor='code-file-input'
						className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
							isImporting
								? 'border-gray-300 bg-gray-50 cursor-not-allowed'
								: 'border-gray-300 hover:bg-gray-50'
						}`}
					>
						<div className='flex flex-col items-center justify-center pt-5 pb-6'>
							{isImporting ? (
								<>
									<FileSpreadsheet className='w-10 h-10 mb-2 text-gray-400' />
									<p className='mb-2 text-sm text-gray-500'>
										{importProgress || 'Importing...'}
									</p>
								</>
							) : (
								<>
									<Upload className='w-10 h-10 mb-2 text-gray-400' />
									<p className='mb-2 text-sm text-gray-500'>
										<span className='font-semibold'>Click to upload</span> or
										drag and drop
									</p>
									<p className='text-xs text-gray-500'>
										Excel files (.xlsx, .xls, .csv) - Codes in first column
									</p>
								</>
							)}
						</div>
					</label>
				</div>
			</CardContent>
		</Card>
	)
}
