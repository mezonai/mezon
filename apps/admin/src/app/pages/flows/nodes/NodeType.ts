import * as yup from 'yup';
import CodeEditorField from '../../../components/InputField/CodeEditorField';
import CustomConditionsField from '../../../components/InputField/CustomConditionsField';
import CustomEmbedField from '../../../components/InputField/CustomEmbedField';
import CustomParamsField from '../../../components/InputField/CustomParamsField';
import CustomRoutingRulesFiled from '../../../components/InputField/CustomRoutingRulesFiled';
import CustomSelectField from '../../../components/InputField/CustomSelectField';
import CustomTagsField from '../../../components/InputField/CustomTagsField';
import CustomTextField from '../../../components/InputField/CustomTextField';
import CustomToggleField from '../../../components/InputField/CustomToggleField';
import MultiImageUploadField from '../../../components/MultiImageUploadField';
import { scheduleSchemas } from './NodeSchemas/scheduleSchemas';

// list of node types with their schema, bridge schema, and anchors. This is used to render the node in the flow editor
// add more node types in this list
const NodeTypes = [
	{
		type: 'chatTrigger',
		label: 'Chat Trigger',
		schema: yup.object().shape({
			commandName: yup
				.string()
				.required('Command Name is required')
				.test('starts-with-asterisk', 'Command Name must start with an asterisk (*)', (value) => !!value && value.startsWith('*'))
				.test('not-have-space', 'Command Name must not have space', (value) => !!value && !value?.trim()?.includes(' ')),
			options: yup.array().nullable()
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				commandName: {
					type: 'string',
					uniforms: { component: CustomTextField, label: 'Command Name', name: 'commandName', placeholder: 'Enter command input' }
				},
				options: {
					type: 'string',
					uniforms: { component: CustomTagsField, label: 'Options', name: 'options', placeholder: 'Enter more options' }
				}
			},
			required: ['commandName']
		},
		anchors: {
			source: [{ id: 'command-input-source-1', text: 'Response' }],
			target: []
		},
		initialValue: {
			commandName: '*',
			options: []
		}
	},
	{
		type: 'uploadedImage',
		label: 'Response',
		schema: yup
			.object()
			.shape({
				message: yup
					.string()
					.test('no-starts-with-asterisk', 'Message can not start with an asterisk (*)', (value) => !value || !value.startsWith('*')),
				image: yup.array().nullable()
			})
			.test('at-least-one-value', 'Either message or image must be provided', (value) => {
				const hasMessage = !!value?.message && value.message.trim() !== '';
				const hasImage = Array.isArray(value?.image) && value.image.length > 0;
				return hasMessage || hasImage;
			}),
		bridgeSchema: {
			type: 'object',
			properties: {
				message: {
					type: 'string',
					uniforms: { component: CustomTextField, label: 'Message', name: 'message', placeholder: 'Enter message' }
				},
				image: { type: 'array', uniforms: { component: MultiImageUploadField, label: 'Uploaded Image', name: 'image' } }
			},
			required: []
		},
		anchors: {
			source: [],
			target: [{ id: 'command-output-target-1', text: 'Chat Trigger' }]
		},
		initialValue: {
			message: '',
			image: []
		}
	},
	{
		type: 'commandOutput',
		label: 'Response',
		schema: yup.object().shape({
			message: yup
				.string()
				.test('no-starts-with-asterisk', 'Message can not start with an asterisk (*)', (value) => !!value && !value.startsWith('*')),
			image: yup.array().nullable()
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				message: {
					type: 'string',
					uniforms: { component: CustomTextField, label: 'Message', name: 'message', placeholder: 'Enter message' }
				},
				image: { type: 'array', uniforms: { component: MultiImageUploadField, label: 'Uploaded Image', name: 'image' } }
			},
			required: []
		},
		anchors: {
			source: [],
			target: [{ id: 'command-output-target-1', text: 'Chat Trigger' }]
		},
		initialValue: {
			message: '',
			image: []
		}
	},
	{
		type: 'httpRequest',
		label: 'HTTP Request',
		schema: yup.object().shape({
			apiKey: yup.string(),
			url: yup.string().required('Url is required'),
			method: yup.string().required('Method is required').oneOf(['GET', 'POST'], 'Method must be either GET or POST'),
			defaultOptions: yup.object().nullable(),
			headers: yup.object().nullable(),
			body: yup.string().nullable()
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				url: { type: 'string', uniforms: { component: CustomTextField, label: 'Api Url', name: 'url' } },
				method: {
					type: 'string',
					uniforms: {
						component: CustomSelectField,
						label: 'Method (GET | POST)',
						name: 'method',
						defaultValue: 'GET',
						options: [
							{ label: 'GET', value: 'GET' },
							{ label: 'POST', value: 'POST' }
						]
					}
				},
				defaultOptions: {
					type: 'object',
					uniforms: {
						component: CustomParamsField,
						label: 'Default Query Options',
						placeholder: 'Add default options',
						name: 'defaultOptions'
					}
				},
				headers: {
					type: 'object',
					uniforms: { component: CustomParamsField, label: 'Headers', placeholder: 'Add Header Options', name: 'headers' }
				},
				body: {
					type: 'string',
					uniforms: {
						component: CodeEditorField,
						label: 'Body of post method',
						name: 'body'
					}
				}
			},
			required: []
		},
		anchors: {
			source: [{ id: 'api-loader-source-1', text: 'If' }],
			target: [{ id: 'api-loader-target-1', text: 'Chat Trigger' }]
		},
		initialValue: {
			url: '',
			method: 'GET'
		}
	},
	{
		type: 'if',
		label: 'If',
		schema: yup.object().shape({
			conditions: yup
				.array()
				.of(
					yup.object().shape({
						left: yup.string().required('Left value is required'),
						operator: yup.string().required('Operator is required'),
						right: yup.string(),
						type: yup.string().oneOf(['string', 'number', 'boolean', 'array', 'object', 'dateTime']).required('Type is required'),
						logic: yup.string().oneOf(['AND', 'OR']).default('AND')
					})
				)
				.min(1, 'At least one condition is required'),
			convertTypes: yup.boolean().default(false),
			options: yup
				.array()
				.of(
					yup.object().shape({
						key: yup.string().required(),
						value: yup.string().required()
					})
				)
				.nullable()
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				conditions: {
					type: 'array',
					uniforms: {
						component: CustomConditionsField,
						label: 'Conditions',
						name: 'conditions'
					}
				},
				convertTypes: {
					type: 'boolean',
					uniforms: {
						component: CustomToggleField,
						label: 'Convert types where required',
						name: 'convertTypes'
					}
				},
				options: {
					type: 'array',
					uniforms: {
						component: CustomParamsField,
						label: 'Options',
						name: 'options'
					}
				}
			},
			required: ['conditions']
		},
		anchors: {
			source: [
				{ id: 'if-source-1', text: 'True' },
				{ id: 'else-source-1', text: 'False' }
			],
			target: [{ id: 'if-target-1', text: 'All' }]
		},
		initialValue: {
			conditions: [{ left: '', operator: 'is equal to', right: '', type: 'string', logic: 'AND' }],
			convertTypes: false,
			options: []
		}
	},
	{
		type: 'webhook',
		label: 'Webhook',
		schema: yup.object().shape({
			url: yup.string().required('Webhook URL is required'),
			method: yup.string().oneOf(['GET', 'POST'], 'Method must be GET or POST').required('Method is required'),
			headers: yup.object().nullable(),
			body: yup.string().nullable()
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				url: {
					type: 'string',
					uniforms: {
						component: CustomTextField,
						label: 'Webhook URL',
						name: 'url',
						readOnly: true,
						disabled: true,
						placeholder: 'https://example.com/webhook'
					}
				},
				method: {
					type: 'string',
					uniforms: {
						component: CustomSelectField,
						label: 'Method (POST)',
						name: 'method',
						defaultValue: 'POST',
						options: [{ label: 'POST', value: 'POST' }]
					}
				},
				body: {
					type: 'string',
					uniforms: {
						component: CodeEditorField,
						label: 'Body',
						name: 'body',
						readOnly: true,
						value: `{
  "channelId": "text",
  "message": "text",
  "attachments": [
    {
      url: "text",
      filetype: "image/jpeg"
    }
  ]
}`
					}
				}
			},
			required: ['url', 'method']
		},
		anchors: {
			source: [{ id: 'webhook-source-1', text: 'Condition' }],
			target: []
		},
		initialValue: {
			url: '',
			method: 'POST',
			headers: {},
			body: ''
		}
	},
	{
		type: 'editField',
		label: 'Edit Field',
		schema: yup.object().shape({
			// mode: yup.string().oneOf(['manual', 'json']).required('Mode is required'),
			includeOtherInputFields: yup.boolean(),
			// fields: yup.array().of(
			// 	yup.object().shape({
			// 		name: yup.string().required('Field Name is required'),
			// 		value: yup.string().required('Field Value is required')
			// 	})
			// ),
			jsonTemplate: yup.string().nullable(),
			options: yup.array().of(
				yup.object().shape({
					key: yup.string().required('Option Key is required'),
					value: yup.string().required('Option Value is required')
				})
			)
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				// mode: {
				// 	type: 'string',
				// 	uniforms: {
				// 		component: CustomSelectField,
				// 		label: 'Mode',
				// 		name: 'mode',
				// 		options: [
				// 			{ label: 'Manual Mapping', value: 'manual' },
				// 			{ label: 'JSON', value: 'json' }
				// 		],
				// 		placeholder: 'Select mode'
				// 	}
				// },
				// fields: {
				// 	type: 'array',
				// 	uniforms: {
				// 		component: CustomFieldMapping,
				// 		label: 'Fields',
				// 		name: 'fields',
				// 		visibleIf: { mode: 'manual' }
				// 	}
				// },
				jsonTemplate: {
					type: 'string',
					uniforms: {
						component: CodeEditorField,
						label: 'JSON',
						name: 'jsonTemplate',
						language: 'json'
					}
				},
				// includeOtherInputFields: {
				// 	type: 'boolean',
				// 	uniforms: {
				// 		component: CustomToggleField,
				// 		label: 'Include Other Input Fields',
				// 		name: 'includeOtherInputFields'
				// 	}
				// },
				options: {
					type: 'array',
					uniforms: {
						component: CustomParamsField,
						label: 'Options',
						placeholder: 'Add options',
						name: 'options'
					}
				}
			},
			required: ['jsonTemplate']
		},
		anchors: {
			source: [],
			target: [{ id: 'edit-field-target-1', text: 'Api/Webhook' }]
		},
		initialValue: {
			mode: 'manual',
			fields: [],
			jsonTemplate: '{\n "message": "text",\n "data": "data"\n}',
			includeOtherInputFields: false,
			options: []
		}
	},
	{
		type: 'schedule',
		label: 'Schedule',
		schema: yup.object().shape({
			interval: yup.string().oneOf(['minutes', 'hours', 'days', 'weeks', 'months']).required('Interval is required')
		}),
		bridgeSchema: scheduleSchemas.days.bridgeSchema,
		anchors: {
			source: [{ id: 'schedule-source-1', text: 'Api/Webhook/Response' }],
			target: []
		},
		initialValue: {
			interval: 'days',
			intervalValue: 1,
			hour: 0,
			minute: 0,
			weekday: '',
			month: 1,
			enabled: true
		},
		isDynamicSchema: true,
		getDynamicConfig: (data: any) => {
			const interval = data?.interval || 'days';
			return scheduleSchemas[interval as keyof typeof scheduleSchemas];
		}
	},
	{
		type: 'embedMessage',
		label: 'Embed Message',
		schema: yup.object().shape({
			embed: yup.mixed().required('Embed is required')
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				embed: {
					type: 'object',
					uniforms: {
						component: CustomEmbedField,
						label: 'Embeds',
						name: 'embed'
					}
				}
			},
			required: ['embed']
		},
		anchors: {
			source: [],
			target: [{ id: 'embed-message-target-1', text: 'Input' }]
		},
		initialValue: {
			embed: {
				mode: 'fields',
				fields: {
					description: '',
					author: '',
					color: '',
					timestamp: '',
					title: '',
					url: '',
					image: '',
					thumbnail: '',
					video: ''
				},
				raw: '{}'
			}
		}
	},
	{
		type: 'switch',
		label: 'Switch',
		schema: yup.object().shape({
			routingRules: yup
				.array()
				.of(
					yup.object().shape({
						conditions: yup.object().shape({
							left: yup.string().required('Left value is required'),
							operator: yup.string().required('Operator is required'),
							right: yup.string(),
							type: yup.string().oneOf(['string', 'number', 'boolean', 'array', 'object', 'dateTime']).required('Type is required')
						})
						// outputName: yup.string().required('Output name is required')
					})
				)
				.min(1, 'At least one condition is required'),
			convertTypes: yup.boolean().default(false),
			options: yup
				.array()
				.of(
					yup.object().shape({
						key: yup.string().required(),
						value: yup.string().required()
					})
				)
				.nullable()
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				routingRules: {
					type: 'array',
					uniforms: {
						component: CustomRoutingRulesFiled,
						label: 'Routing Rules',
						name: 'routingRules'
					}
				},
				convertTypes: {
					type: 'boolean',
					uniforms: {
						component: CustomToggleField,
						label: 'Convert types where required',
						name: 'convertTypes'
					}
				},
				options: {
					type: 'array',
					uniforms: {
						component: CustomParamsField,
						label: 'Options',
						name: 'options'
					}
				}
			},
			required: ['routingRules']
		},
		anchors: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			source: (nodeData: { routingRules: any[] }) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return (nodeData?.routingRules || []).map((rule, index: number) => ({
					id: rule.id || `switch-source-${index + 1}`,
					text: '0' || `${index + 1}`
				}));
			},
			target: [{ id: 'switch-target-1', text: 'Input' }]
		},
		initialValue: {
			routingRules: [
				{
					id: 'switch-source-1',
					conditions: { left: '', operator: 'is equal to', right: '', type: 'string', logic: 'AND' }
				}
			],
			convertTypes: false,
			options: []
		}
	}
];
export default NodeTypes;
