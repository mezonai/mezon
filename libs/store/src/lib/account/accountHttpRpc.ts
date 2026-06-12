import type { ApiAccount } from 'mezon-js';
import { Account, NoParams } from 'mezon-js-protobuf';
import type { MezonHttpRpcSpec } from '../mezonHttpRpc';

export function getAccountHttpRpc(): MezonHttpRpcSpec<ApiAccount> {
	return {
		path: '/mezon.api.Mezon/GetAccount',
		encodeBody: () => NoParams.encode(NoParams.fromPartial({})).finish(),
		decodeBody: (bytes) => Account.decode(bytes) as ApiAccount
	};
}
