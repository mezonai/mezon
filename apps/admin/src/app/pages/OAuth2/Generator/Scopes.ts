export interface IScope {
	id: string;
}

export const scopes: IScope[] = [
	{
		id: 'identity'
	},
	{
		id: 'email'
	},
	{
		id: 'connection'
	},
	{
		id: 'guilds'
	},
	{
		id: 'guilds.join'
	},
	{
		id: 'guilds.member.read'
	},
	{
		id: 'guilds.channel.read'
	},
	{
		id: 'gdm.join'
	},
	{
		id: 'bot'
	},
	{
		id: 'rpc'
	},
	{
		id: 'rpc.notification.read'
	},
	{
		id: 'rpc.voice.read'
	},
	{
		id: 'rpc.voice.write'
	},
	{
		id: 'rpc.video.read'
	},
	{
		id: 'rpc.video.write'
	},
	{
		id: 'rpc.screenshare.read'
	},
	{
		id: 'rpc.screenshare.write'
	}
];
