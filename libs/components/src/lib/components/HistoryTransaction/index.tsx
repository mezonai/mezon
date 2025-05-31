import {
	fetchDetailTransaction,
	fetchListWalletLedger,
	selectCountWalletLedger,
	selectDetailedger,
	selectWalletLedger,
	useAppDispatch,
	useAppSelector,
} from "@mezon/store"
import { Icons } from "@mezon/ui"
import { formatNumber } from "@mezon/utils"
import { Pagination } from "flowbite-react"
import type { ApiWalletLedger } from "mezon-js/api.gen"

import { useEffect, useRef, useState } from "react"
const limitWallet = 8

interface IProps {
	onClose: () => void
}
const HistoryTransaction = ({ onClose }: IProps) => {
	const dispatch = useAppDispatch()
	const walletLedger = useAppSelector((state) => selectWalletLedger(state))
	const detailLedger = useAppSelector((state) => selectDetailedger(state))

	const count = useAppSelector((state) => selectCountWalletLedger(state))
	const [currentPage, setCurrentPage] = useState(1)
	const totalPages = count === undefined ? 0 : Math.ceil(count / limitWallet)
	const [openedTransactionId, setOpenedTransactionId] = useState<string | null>(null)

	const [detailMap, setDetailMap] = useState<{ [transId: string]: any }>({})
	const fetchedDetailIds = useRef<Set<string>>(new Set())

	const [modalDetail, setModalDetail] = useState<{ open: boolean; detail: any | null }>({ open: false, detail: null })

	useEffect(() => {
		dispatch(fetchListWalletLedger({ page: 1 }))
	}, [dispatch])

	useEffect(() => {
		if (walletLedger?.length) {
			walletLedger.forEach((item) => {
				if (item.transaction_id && !fetchedDetailIds.current.has(item.transaction_id)) {
					dispatch(fetchDetailTransaction({ transId: item.transaction_id }))
					fetchedDetailIds.current.add(item.transaction_id)
				}
			})
		}
	}, [dispatch, walletLedger])

	useEffect(() => {
		if (detailLedger && detailLedger.trans_id) {
			setDetailMap((prev) => ({ ...prev, [String(detailLedger.trans_id)]: detailLedger }))
		}
	}, [detailLedger])

	const onPageChange = (page: number) => {
		setCurrentPage(page)
		dispatch(fetchListWalletLedger({ page: page }))
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		const day = date.getDate().toString().padStart(2, "0")
		const month = (date.getMonth() + 1).toString().padStart(2, "0")
		const year = date.getFullYear()
		const hours = date.getHours().toString().padStart(2, "0")
		const minutes = date.getMinutes().toString().padStart(2, "0")
		return `${day}/${month}/${year} ${hours}:${minutes}`
	}

	const renderAmount = (amount: number) => {
		if (amount < 0) {
			return (
				<span className="text-red-500 font-bold text-base">{formatNumber(amount, "vi-VN", "VND")}</span>
			)
		}
		return (
			<span className="text-emerald-500 font-bold text-base">+{formatNumber(amount, "vi-VN", "VND")}</span>
		)
	}

	const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={40} height={40} {...props}>
			<path strokeLinecap="round" strokeLinejoin="round" d="m19.5 19.5-15-15m0 0v11.25m0-11.25h11.25" />
		</svg>
	)
	const ReceiveIcon = (props: React.SVGProps<SVGSVGElement>) => (
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={40} height={40} {...props}>
			<path strokeLinecap="round" strokeLinejoin="round" d="m4.5 4.5 15 15m0 0V8.25m0 11.25H8.25" />
		</svg>
	)

	const renderSenderRecipient = (item: ApiWalletLedger) => {
		const value = item.value ?? 0
		const detail = detailMap[item.transaction_id ?? ""]
		if (value < 0) {
			return (
				<div className="flex items-center gap-3">
					<SendIcon style={{ color: '#ef4444', width: 32, height: 32 }} />
					<div className="flex flex-col">
						<span className="text-xs text-gray-500 dark:text-gray-400">To</span>
						<span className="text-sm text-red-500 font-semibold">{detail?.receiver_username || "Loading..."}</span>
					</div>
				</div>
			)
		}
		return (
			<div className="flex items-center gap-3">
				<ReceiveIcon style={{ color: '#22c55e', width: 32, height: 32 }} />
				<div className="flex flex-col">
					<span className="text-xs text-gray-500 dark:text-gray-400">From</span>
					<span className="text-sm text-emerald-500 font-semibold">{detail?.sender_username || "Loading..."}</span>
				</div>
			</div>
		)
	}

	const toggleDetails = (transactionId: string) => {
		setOpenedTransactionId(openedTransactionId === transactionId ? null : transactionId)
	}

	return (
		<div className="outline-none justify-center flex overflow-x-hidden items-center overflow-y-auto fixed inset-0 z-30 focus:outline-none bg-black/60 backdrop-blur-sm dark:text-white text-black hide-scrollbar overflow-hidden">
			<div className="relative w-full sm:h-auto rounded-2xl max-w-[900px] min-h-[60vh] shadow-2xl">
				<div className="rounded-t-2xl text-sm overflow-hidden">
					<div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white flex justify-between items-center p-6">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<div>
								<h4 className="font-bold text-base">Transaction History</h4>
								<p className="text-white/80 text-xs">Track your wallet transactions</p>
							</div>
						</div>
						<button
							className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200"
							onClick={onClose}
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
				{walletLedger?.length ? (
					<div className="bg-white dark:bg-gray-900 rounded-b-2xl dark:text-textDarkTheme text-textLightTheme">
						<div>
							<div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
								<div className="col-span-5">
									<span className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider">
										Sender / Recipient
									</span>
								</div>
								<div className="col-span-3 text-center">
									<span className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider">
										Amount
									</span>
								</div>
								<div className="col-span-3 text-center">
									<span className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider">
										Time
									</span>
								</div>
								<div className="col-span-1"></div>
							</div>
							<div className="max-h-[400px] overflow-y-auto scrollbar-thin  [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[#5865F2] [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-track]:bg-gray-200">
								{walletLedger?.map((item, index) => {
									return (
										<div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200" onClick={() => setModalDetail({ open: true, detail: detailMap[item.transaction_id ?? ""] })}>
											<div className="grid grid-cols-12 gap-6 px-8 py-6 items-center">
												<div className="col-span-5 flex items-center">{renderSenderRecipient(item)}</div>
												<div className="col-span-3 flex items-center justify-center">{renderAmount(item.value ?? 0)}</div>
												<div className="col-span-3 flex items-center justify-center">
													<span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{formatDate(item.create_time ?? "")}</span>
												</div>
											</div>
										</div>
									)
								})}
							</div>
						</div>
						<div className="flex justify-center items-center px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
							<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
						</div>
					</div>
				) : (
					<div className="bg-white dark:bg-gray-900 rounded-b-2xl">
						<div className="flex flex-col gap-4 py-20 items-center">
							<div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
								<Icons.EmptyType />
							</div>
							<div className="text-center">
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No transactions yet</h3>
								<p className="text-gray-600 dark:text-gray-400">Your transactions will appear here</p>
							</div>
						</div>
					</div>
				)}
			</div>
			{modalDetail.open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-[380px] w-full p-0 relative animate-fadeIn overflow-hidden">
						<button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 flex items-center justify-center z-10" onClick={() => setModalDetail({ open: false, detail: null })}>
							<svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
						{modalDetail.detail ? (
							<>
								<div className="flex flex-col items-center pt-8 pb-4 px-6 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
									<div className="rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center mb-3" style={{ width: 64, height: 64 }}>
										{modalDetail.detail.amount < 0 ? (
											<SendIcon style={{ color: '#ef4444', width: 40, height: 40 }} />
										) : (
											<ReceiveIcon style={{ color: '#22c55e', width: 40, height: 40 }} />
										)}
									</div>
									<div className={`font-bold ${modalDetail.detail.amount < 0 ? 'text-red-500' : 'text-emerald-500'} text-2xl mb-1`}>{modalDetail.detail.amount < 0 ? '-' : '+'}{formatNumber(Math.abs(modalDetail.detail.amount ?? 0), "vi-VN", "VND")}</div>
									<div className="text-xs text-gray-500 mb-2">{modalDetail.detail.amount < 0 ? 'Sent' : 'Received'}</div>
								</div>
								<div className="px-6 pb-6 pt-2 flex flex-col gap-3">
									<div className="flex flex-col gap-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
										<span className="text-xs text-gray-500">Sender</span>
										<span className="text-sm font-medium text-gray-900 dark:text-white">{modalDetail.detail.sender_username}</span>
									</div>
									<div className="flex flex-col gap-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
										<span className="text-xs text-gray-500">Recipient</span>
										<span className="text-sm font-medium text-gray-900 dark:text-white">{modalDetail.detail.receiver_username}</span>
									</div>
									<div className="flex flex-col gap-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
										<span className="text-xs text-gray-500">Created At</span>
										<span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(modalDetail.detail.create_time ?? "")}</span>
									</div>
									<div className="flex flex-col gap-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
										<span className="text-xs text-gray-500">Transaction ID</span>
										<span className="text-sm font-medium text-gray-900 dark:text-white">{modalDetail.detail.trans_id}</span>
									</div>
									<div className="flex flex-col gap-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
										<span className="text-xs text-gray-500">Note</span>
										<span className="text-sm font-medium text-gray-900 dark:text-white">{modalDetail.detail.metadata || 'No note'}</span>
									</div>
								</div>
							</>
						) : (
							<div className="text-center text-gray-500 p-8">Loading transaction details...</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

export default HistoryTransaction
