import type { UserData } from '../../pages/dashboard/types';

interface UsersTableProps {
	data: UserData[];
}

function UsersTable({ data }: UsersTableProps) {
	return (
		<div className="bg-white dark:bg-[#2b2d31] p-6 rounded-lg border dark:border-[#4d4f52]">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-xl font-semibold">User Activity Data</h3>
				<button className="px-4 py-2 border dark:border-[#4d4f52] rounded-md hover:bg-gray-50 dark:hover:bg-[#1e1f22] text-sm flex items-center gap-2">
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="inline">
						<path
							d="M7 1V9M7 9L4 6M7 9L10 6M1 13H13"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					Export CSV
				</button>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead className="bg-gray-50 dark:bg-[#1e1f22]">
						<tr>
							<th className="px-4 py-3 text-left text-sm font-semibold border-b dark:border-[#4d4f52]">
								<div className="flex items-center">
									<span>User name</span>
									<input
										aria-label="Select User name column"
										type="checkbox"
										className="ml-2 h-4 w-4 rounded border dark:border-[#4d4f52]"
										defaultChecked
									/>
								</div>
							</th>
							<th className="px-4 py-3 text-left text-sm font-semibold border-b dark:border-[#4d4f52]">
								<div className="flex items-center">
									<span>Messages</span>
									<input
										aria-label="Select Messages column"
										type="checkbox"
										className="ml-2 h-4 w-4 rounded border dark:border-[#4d4f52]"
										defaultChecked
									/>
								</div>
							</th>
						</tr>
					</thead>
					<tbody>
						{data.map((row, index) => (
							<tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#1e1f22]">
								<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.userName}</td>
								<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.messages}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export default UsersTable;
