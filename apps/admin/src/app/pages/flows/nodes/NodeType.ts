import * as yup from 'yup';
import CodeEditorField from '../../../components/InputField/CodeEditorField';
import CustomParamsField from '../../../components/InputField/CustomParamsField';
import CustomSelectField from '../../../components/InputField/CustomSelectField';
import CustomTagsField from '../../../components/InputField/CustomTagsField';
import CustomTextField from '../../../components/InputField/CustomTextField';
import MultiImageUploadField from '../../../components/MultiImageUploadField';

// list of node types with their schema, bridge schema, and anchors. This is used to render the node in the flow editor
// add more node types in this list
const NodeTypes = [
	{
		type: 'trigger',
		label: 'Trigger',
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
			target: [{ id: 'command-output-target-1', text: 'Trigger' }]
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
			target: [{ id: 'command-output-target-1', text: 'Trigger' }]
		},
		initialValue: {
			message: '',
			image: []
		}
	},
	{
		type: 'api',
		label: 'Api',
		schema: yup.object().shape({
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
			source: [{ id: 'api-loader-source-1', text: 'Condition' }],
			target: [{ id: 'api-loader-target-1', text: 'Splitter Text' }]
		},
		initialValue: {
			url: '',
			method: 'GET'
		}
	},
	{
		type: 'condition',
		label: 'Condition',
		schema: yup.object().shape({
			variable: yup.string().required('Variable is required'),
			triggerUser: yup.string(),
			functionName: yup.string().required('Function Name is required'),
			functionBody: yup.string().required('Function Body is required')
		}),
		bridgeSchema: {
			type: 'object',
			properties: {
				functionName: { type: 'string', uniforms: { component: CustomTextField, label: 'Function Name', name: 'functionName' } },
				variable: { type: 'string', uniforms: { component: CustomTextField, label: 'Variable', name: 'variable' } },
				triggerUser: { type: 'string', uniforms: { component: CustomTextField, label: 'Trigger User', name: 'triggerUser' } },
				functionBody: {
					type: 'string',
					uniforms: { component: CodeEditorField, label: 'Function Body', name: 'functionBody' }
				}
			},
			required: []
		},
		anchors: {
			source: [],
			target: [{ id: 'format-function-target-1', text: 'Api Loader/Webhook' }]
		},
		initialValue: {
			functionName: 'customResponse',
			variable: 'data',
			triggerUser: 'author',
			functionBody: `return {
  "message": data.message,
  "attachments": data.attachments
}`
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
	}
];
export default NodeTypes;
