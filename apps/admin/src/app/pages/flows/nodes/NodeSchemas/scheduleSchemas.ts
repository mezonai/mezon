import * as yup from 'yup';
import CustomChannelSelectField from '../../../../components/InputField/CustomChannelSelectField';
import CustomSelectField from '../../../../components/InputField/CustomSelectField';
import CustomTextField from '../../../../components/InputField/CustomTextField';

export const scheduleSchemas = {
	minutes: {
		schema: yup.object().shape({
			interval: yup.string().oneOf(['minutes']).required(),
			intervalValue: yup.number().min(1).max(59).required('Must be range 1-59'),
			channelId: yup.string().required('Channel is required')
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				interval: {
					type: 'string',
					uniforms: {
						component: CustomSelectField,
						label: 'Trigger Interval',
						name: 'interval',
						options: [
							{ label: 'Minutes', value: 'minutes' },
							{ label: 'Hours', value: 'hours' },
							{ label: 'Days', value: 'days' },
							{ label: 'Weeks', value: 'weeks' },
							{ label: 'Months', value: 'months' },
							{ label: 'Custom (Cron)', value: 'custom' }
						]
					}
				},
				intervalValue: {
					type: 'number',
					uniforms: {
						component: CustomTextField,
						label: 'Minutes Between Triggers',
						name: 'intervalValue',
						placeholder: 'e.g. 5',
						min: 1,
						max: 59
					}
				},
				channelId: {
					type: 'string',
					uniforms: {
						component: CustomChannelSelectField,
						label: 'Channel',
						name: 'channelId'
					}
				}
			},
			required: ['interval', 'intervalValue', 'channelId']
		}
	},
	hours: {
		schema: yup.object().shape({
			interval: yup.string().oneOf(['hours']).required(),
			intervalValue: yup.number().min(1).required('Interval value is required'),
			minute: yup.number().min(0).max(59).required('Minute is required'),
			channelId: yup.string().required('Channel is required')
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				interval: {
					type: 'string',
					uniforms: {
						component: CustomSelectField,
						label: 'Trigger Interval',
						name: 'interval',
						options: [
							{ label: 'Minutes', value: 'minutes' },
							{ label: 'Hours', value: 'hours' },
							{ label: 'Days', value: 'days' },
							{ label: 'Weeks', value: 'weeks' },
							{ label: 'Months', value: 'months' },
							{ label: 'Custom (Cron)', value: 'custom' }
						]
					}
				},
				intervalValue: {
					type: 'number',
					uniforms: {
						component: CustomTextField,
						label: 'Hours Between Triggers',
						name: 'intervalValue',
						placeholder: 'e.g. 2',
						min: 1,
						max: 23
					}
				},
				minute: {
					type: 'number',
					uniforms: {
						component: CustomTextField,
						label: 'Trigger at Minute',
						name: 'minute',
						placeholder: 'e.g. 0',
						min: 0,
						max: 59
					}
				},
				channelId: {
					type: 'string',
					uniforms: {
						component: CustomChannelSelectField,
						label: 'Channel',
						name: 'channelId'
					}
				}
			},
			required: ['interval', 'intervalValue', 'minute', 'channelId']
		}
	},
	days: {
		schema: yup.object().shape({
			interval: yup.string().oneOf(['days']).required(),
			intervalValue: yup.number().min(1).required('Interval value is required'),
			hour: yup.number().min(0).max(23).required('Hour is required'),
			minute: yup.number().min(0).max(59).required('Minute is required'),
			channelId: yup.string().required('Channel is required')
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				interval: {
					type: 'string',
					uniforms: {
						component: CustomSelectField,
						label: 'Trigger Interval',
						name: 'interval',
						options: [
							{ label: 'Minutes', value: 'minutes' },
							{ label: 'Hours', value: 'hours' },
							{ label: 'Days', value: 'days' },
							{ label: 'Weeks', value: 'weeks' },
							{ label: 'Months', value: 'months' },
							{ label: 'Custom (Cron)', value: 'custom' }
						]
					}
				},
				intervalValue: {
					type: 'number',
					uniforms: {
						component: CustomTextField,
						label: 'Days Between Triggers',
						name: 'intervalValue',
						placeholder: 'e.g. 1',
						min: 1,
						max: 31
					}
				},
				hour: {
					type: 'number',
					uniforms: {
						component: CustomSelectField,
						label: 'Trigger at Hour',
						name: 'hour',
						options: Array.from({ length: 24 }, (_, i) => ({
							label: i === 0 ? 'Midnight' : String(i).padStart(2, '0'),
							value: i
						}))
					}
				},
				minute: {
					type: 'number',
					uniforms: {
						component: CustomTextField,
						label: 'Trigger at Minute',
						name: 'minute',
						placeholder: 'e.g. 0',
						min: 0,
						max: 59
					}
				},
				channelId: {
					type: 'string',
					uniforms: {
						component: CustomChannelSelectField,
						label: 'Channel',
						name: 'channelId'
					}
				}
			},
			required: ['interval', 'intervalValue', 'hour', 'minute', 'channelId']
		}
	},
	weeks: {
		schema: yup.object().shape({
			interval: yup.string().oneOf(['weeks']).required(),
			intervalValue: yup.number().min(1).required('Interval value is required'),
			weekday: yup.string().required('Weekday is required'),
			hour: yup.number().min(0).max(23).required('Hour is required'),
			minute: yup.number().min(0).max(59).required('Minute is required'),
			channelId: yup.string().required('Channel is required')
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				interval: {
					type: 'string',
					uniforms: {
						component: CustomSelectField,
						label: 'Trigger Interval',
						name: 'interval',
						options: [
							{ label: 'Minutes', value: 'minutes' },
							{ label: 'Hours', value: 'hours' },
							{ label: 'Days', value: 'days' },
							{ label: 'Weeks', value: 'weeks' },
							{ label: 'Months', value: 'months' },
							{ label: 'Custom (Cron)', value: 'custom' }
						]
					}
				},
				intervalValue: {
					type: 'number',
					uniforms: {
						component: CustomTextField,
						label: 'Weeks Between Triggers',
						name: 'intervalValue',
						placeholder: 'e.g. 1',
						min: 1,
						max: 52
					}
				},
				weekday: {
					type: 'string',
					uniforms: {
						component: CustomSelectField,
						label: 'Trigger on Weekday',
						name: 'weekday',
						options: [
							{ label: 'Sunday', value: '0' },
							{ label: 'Monday', value: '1' },
							{ label: 'Tuesday', value: '2' },
							{ label: 'Wednesday', value: '3' },
							{ label: 'Thursday', value: '4' },
							{ label: 'Friday', value: '5' },
							{ label: 'Saturday', value: '6' }
						]
					}
				},
				hour: {
					type: 'number',
					uniforms: {
						component: CustomSelectField,
						label: 'Trigger at Hour',
						name: 'hour',
						options: Array.from({ length: 24 }, (_, i) => ({
							label: i === 0 ? 'Midnight' : String(i).padStart(2, '0'),
							value: i
						}))
					}
				},
				minute: {
					type: 'number',
					uniforms: {
						component: CustomTextField,
						label: 'Trigger at Minute',
						name: 'minute',
						placeholder: 'e.g. 0',
						min: 0,
						max: 59
					}
				},
				channelId: {
					type: 'string',
					uniforms: {
						component: CustomChannelSelectField,
						label: 'Channel',
						name: 'channelId'
					}
				}
			},
			required: ['interval', 'intervalValue', 'weekday', 'hour', 'minute', 'channelId']
		}
	},
	months: {
		schema: yup.object().shape({
			interval: yup.string().oneOf(['months']).required(),
			intervalValue: yup.number().min(1).required('Interval value is required'),
			day: yup.number().min(1).max(31).required('Day of month is required'),
			hour: yup.number().min(0).max(23).required('Hour is required'),
			minute: yup.number().min(0).max(59).required('Minute is required'),
			channelId: yup.string().required('Channel is required')
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				interval: {
					type: 'string',
					uniforms: {
						component: CustomSelectField,
						label: 'Trigger Interval',
						name: 'interval',
						options: [
							{ label: 'Minutes', value: 'minutes' },
							{ label: 'Hours', value: 'hours' },
							{ label: 'Days', value: 'days' },
							{ label: 'Weeks', value: 'weeks' },
							{ label: 'Months', value: 'months' },
							{ label: 'Custom (Cron)', value: 'custom' }
						]
					}
				},
				intervalValue: {
					type: 'number',
					uniforms: {
						component: CustomTextField,
						label: 'Months Between Triggers',
						name: 'intervalValue',
						placeholder: 'e.g. 1',
						min: 1,
						max: 12
					}
				},
				day: {
					type: 'number',
					uniforms: {
						component: CustomTextField,
						label: 'Trigger on Day of Month',
						name: 'day',
						placeholder: 'e.g. 1',
						min: 1,
						max: 31
					}
				},
				hour: {
					type: 'number',
					uniforms: {
						component: CustomSelectField,
						label: 'Trigger at Hour',
						name: 'hour',
						options: Array.from({ length: 24 }, (_, i) => ({
							label: i === 0 ? 'Midnight' : String(i).padStart(2, '0'),
							value: i
						}))
					}
				},
				minute: {
					type: 'number',
					uniforms: {
						component: CustomTextField,
						label: 'Trigger at Minute',
						name: 'minute',
						placeholder: 'e.g. 0',
						min: 0,
						max: 59
					}
				},
				channelId: {
					type: 'string',
					uniforms: {
						component: CustomChannelSelectField,
						label: 'Channel',
						name: 'channelId'
					}
				}
			},
			required: ['interval', 'intervalValue', 'day', 'hour', 'minute', 'channelId']
		}
	},
	custom: {
		schema: yup.object().shape({
			interval: yup.string().oneOf(['custom']).required(),
			cronExpression: yup.string().required('Cron expression is required'),
			channelId: yup.string().required('Channel is required')
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				interval: {
					type: 'string',
					uniforms: {
						component: CustomSelectField,
						label: 'Trigger Interval',
						name: 'interval',
						options: [
							{ label: 'Minutes', value: 'minutes' },
							{ label: 'Hours', value: 'hours' },
							{ label: 'Days', value: 'days' },
							{ label: 'Weeks', value: 'weeks' },
							{ label: 'Months', value: 'months' },
							{ label: 'Custom (Cron)', value: 'custom' }
						]
					}
				},
				cronExpression: {
					type: 'string',
					uniforms: {
						component: CustomTextField,
						label: 'Cron Expression',
						name: 'cronExpression',
						placeholder: 'e.g. */5 * * * *'
					}
				},
				channelId: {
					type: 'string',
					uniforms: {
						component: CustomChannelSelectField,
						label: 'Channel',
						name: 'channelId'
					}
				}
			},
			required: ['interval', 'cronExpression', 'channelId']
		}
	}
};
