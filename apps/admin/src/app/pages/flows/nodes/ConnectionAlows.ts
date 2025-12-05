// create a list of connections allowed between nodes. if a connection is not in this list, it will not be allowed
const ConnectionsAllowed = [
	{
		source: '*',
		target: 'command-output-target-1'
	},
	{
		source: 'command-input-source-1',
		target: 'api-loader-target-1'
	},
	{
		source: '*',
		target: 'edit-field-target-1'
	},
	{
		source: 'schedule-source-1',
		target: 'api-loader-target-1'
	},
	{
		source: '*',
		target: 'if-target-1'
	},
	{
		source: 'if-source-1',
		target: 'api-loader-target-1'
	},
	{
		source: 'else-source-1',
		target: 'api-loader-target-1'
	},
	{
		source: '*',
		target: 'embed-message-target-1'
	},
	{
		source: '*',
		target: 'switch-target-1'
	},
	{
		source: /^switch-source-\d+$/,
		target: '*'
	}
	// add more connections here
];
export default ConnectionsAllowed;
