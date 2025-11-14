import type { IFlow, IFlowDetail } from '../../stores/flow/flow.interface';

interface IFlowMessage {
	input: string;
	output: {
		message: string;
		image: string[];
	};
}
interface IExampleFlow extends IFlow {
	flowDetail: IFlowDetail;
	message: IFlowMessage;
}
const ExampleFlow: IExampleFlow[] = [
	{
		id: 'example-flow-1',
		flowName: 'Command Flow Example',
		description: 'This is an example flow 1',
		createdAt: '2025-01-01T00:00:00.000Z',
		updatedAt: '2025-01-01T00:00:00.000Z',
		status: 'active',
		flowDetail: {
			id: '89c19669-073a-40c7-b55a-0a07c4458510',
			userId: 'a08a1932-10cc-479c-8c1c-7b14cde57fd2',
			flowName: 'Command Flow Example',
			description: 'This is an example about command flow',
			connections: [
				{
					id: '6135d264-7b2c-4667-bdc3-13dc5aa221fa',
					sourceNodeId: 'e3d0ac76-5ca9-4f2f-9f8c-3464f0eaa066',
					sourceHandleId: 'command-input-source-1',
					targetNodeId: '1f076ab8-034a-4f3c-b8e3-963c269e9586',
					targetHandleId: 'command-output-target-1',
					flowId: '89c19669-073a-40c7-b55a-0a07c4458510'
				}
			],
			nodes: [
				{
					id: 'e3d0ac76-5ca9-4f2f-9f8c-3464f0eaa066',
					nodeType: 'commandInput',
					nodeName: 'commandInput',
					measured: '{"width":250,"height":261}',
					position: '{"x":-38,"y":-30}',
					parameters: [
						{
							nodeId: 'e3d0ac76-5ca9-4f2f-9f8c-3464f0eaa066',
							parameterKey: 'commandName',
							parameterValue: '*exampleCommandFlow',
							id: '01188a03-38a3-42a5-8efa-0966c7a851e5'
						}
					],
					data: {
						id: ''
					},
					selected: false
				},
				{
					id: '1f076ab8-034a-4f3c-b8e3-963c269e9586',
					nodeType: 'uploadedImage',
					nodeName: 'uploadedImage',
					measured: '{"width":250,"height":510}',
					position: '{"x":374,"y":-43}',
					parameters: [
						{
							nodeId: '1f076ab8-034a-4f3c-b8e3-963c269e9586',
							parameterKey: 'message',
							parameterValue: 'hello, this is an example command flow example',
							id: '69206788-5bc9-4fc4-9873-1d2163ea198c'
						},
						{
							nodeId: '1f076ab8-034a-4f3c-b8e3-963c269e9586',
							parameterKey: 'image',
							parameterValue:
								'["https://cdn.mezon.ai/0/0/1831890355411226600/932_undefinedtin_tuc_3.jpg","https://cdn.mezon.ai/0/0/1831890355411226600/634_undefinedtin_tuc_4.jpg","https://cdn.mezon.ai/0/0/1831890355411226600/637_undefinedtin_tuc_8.jpg"]',
							id: 'e277134f-a522-439b-96df-996475717be4'
						}
					],
					data: {
						id: ''
					},
					selected: false
				}
			]
		},
		message: {
			input: '*exampleCommandFlow',
			output: {
				message: 'hello, this is an example command flow example',
				image: [
					'https://cdn.mezon.ai/0/0/1831890355411226600/932_undefinedtin_tuc_3.jpg',
					'https://cdn.mezon.ai/0/0/1831890355411226600/634_undefinedtin_tuc_4.jpg',
					'https://cdn.mezon.ai/0/0/1831890355411226600/637_undefinedtin_tuc_8.jpg'
				]
			}
		}
	},
	{
		id: 'example-flow-2',
		flowName: 'Api Loader Flow Example',
		description: 'This is an example about api loader flow',
		status: 'active',
		createdAt: '2025-01-01T00:00:00.000Z',
		updatedAt: '2025-01-01T00:00:00.000Z',
		flowDetail: {
			id: '2731557b-2b10-4aef-a07a-a7368e5a2443',
			userId: 'a08a1932-10cc-479c-8c1c-7b14cde57fd2',
			flowName: 'Api Loader Flow Example',
			description: '',
			connections: [
				{
					id: '79fe5473-543a-4c7b-ba01-df80f53eebeb',
					sourceNodeId: '602ce111-4f14-47ea-a053-95fd2381a8d9',
					sourceHandleId: 'api-loader-source-1',
					targetNodeId: 'de3336f0-ff1d-43d0-872f-cd2a58878dea',
					targetHandleId: 'format-function-target-1',
					flowId: '2731557b-2b10-4aef-a07a-a7368e5a2443'
				},
				{
					id: '1ec3490d-b859-4a06-834e-9b435196c74e',
					sourceNodeId: '56c978da-d138-461f-8226-afdd36108d44',
					sourceHandleId: 'command-input-source-1',
					targetNodeId: '602ce111-4f14-47ea-a053-95fd2381a8d9',
					targetHandleId: 'api-loader-target-1',
					flowId: '2731557b-2b10-4aef-a07a-a7368e5a2443'
				}
			],
			nodes: [
				{
					id: '56c978da-d138-461f-8226-afdd36108d44',
					nodeType: 'commandInput',
					nodeName: 'commandInput',
					measured: '{"width":250,"height":261}',
					position: '{"x":56,"y":-79}',
					parameters: [
						{
							nodeId: '56c978da-d138-461f-8226-afdd36108d44',
							parameterKey: 'commandName',
							parameterValue: '*exampleApiLoaderFlow',
							id: '8f391774-12bf-476f-9fbf-01c12407fabd'
						}
					],
					data: {
						id: ''
					},
					selected: false
				},
				{
					id: '602ce111-4f14-47ea-a053-95fd2381a8d9',
					nodeType: 'apiLoader',
					nodeName: 'apiLoader',
					measured: '{"width":250,"height":362}',
					position: '{"x":387,"y":-79}',
					parameters: [
						{
							nodeId: '602ce111-4f14-47ea-a053-95fd2381a8d9',
							parameterKey: 'method',
							parameterValue: 'GET',
							id: 'edc67de4-c31a-41f1-9a09-dc904d71cc2b'
						},
						{
							nodeId: '602ce111-4f14-47ea-a053-95fd2381a8d9',
							parameterKey: 'url',
							parameterValue: 'https://66b049b36a693a95b53843dc.mockapi.io/list-todo',
							id: 'abde8ca0-435a-4deb-921b-b383f4a0bdc2'
						}
					],
					data: {
						id: ''
					},
					selected: false
				},
				{
					id: 'de3336f0-ff1d-43d0-872f-cd2a58878dea',
					nodeType: 'formatFunction',
					nodeName: 'formatFunction',
					measured: '{"width":250,"height":666}',
					position: '{"x":686,"y":-82}',
					parameters: [
						{
							nodeId: 'de3336f0-ff1d-43d0-872f-cd2a58878dea',
							parameterKey: 'functionName',
							parameterValue: 'getTodo',
							id: '0e3168c9-3020-425a-83be-996c0ec1eb9e'
						},
						{
							nodeId: 'de3336f0-ff1d-43d0-872f-cd2a58878dea',
							parameterKey: 'variable',
							parameterValue: 'data',
							id: '620faf9f-57ae-4895-bbfb-2ed4c88b5b7f'
						},
						{
							nodeId: 'de3336f0-ff1d-43d0-872f-cd2a58878dea',
							parameterKey: 'functionBody',
							parameterValue:
								'let table = `| ${"ID".padEnd(5)} | ${"Title".padEnd(20)} | ${"Is Completed".padEnd(10)} |\\n`;\ntable += `|${"-".repeat(5 + 2)}|${"-".repeat(20 + 2)}|${"-".repeat(10 + 2)}|\\n`;\n\ndata.forEach(item => {\n\t\ttable += `| ${item.id.toString().padEnd(5)} | ${item.title.padEnd(20)} | ${(item.isCompleted ? "Yes" : "No").padEnd(10)} |\\n`;\n});\n\nreturn table;',
							id: '7a988d2f-c98e-466a-a6af-7a64d7954cf4'
						}
					],
					data: {
						id: ''
					},
					selected: false
				}
			]
		},
		message: {
			input: '*exampleApiLoaderFlow',
			output: {
				message:
					'| ID    | Title                | Is Completed |\n|-------|----------------------|------------|\n| 6     | title 6              | Yes        |\n| 7     | title 7              | Yes        |\n| 8     | title 8              | Yes        |\n| 9     | title 9              | Yes        |\n| 11    | title 11             | Yes        |\n| 12    | title 12             | Yes        |\n| 13    | title 13             | No         |\n| 14    | title 14             | No         |\n| 15    | title 15             | No         |\n| 16    | title 16             | No         |\n|',
				image: []
			}
		}
	},
	{
		id: 'example-flow-3',
		flowName: 'Api loader with authorization',
		description: 'This is an example about api loader with authorization',
		status: 'active',
		createdAt: '2025-01-01T00:00:00.000Z',
		updatedAt: '2025-01-01T00:00:00.000Z',
		flowDetail: {
			id: '89c19669-073a-40c7-b55a-0a07c4458510',
			userId: 'a08a1932-10cc-479c-8c1c-7b14cde57fd2',
			flowName: 'Api loader with authorization',
			description: 'This is an example about api loader with authorization',
			connections: [
				{
					id: '034d8c9b-ddce-4713-9471-09bfa4911be2',
					sourceNodeId: 'ca97688b-8922-4f6e-aa29-51908d3acbe0',
					sourceHandleId: 'command-input-source-1',
					targetNodeId: 'f59ae940-4b23-4f26-aeb2-de4022c9b8e5',
					targetHandleId: 'api-loader-target-1',
					flowId: 'efafbd97-9852-41d0-91b8-950be128926e'
				},
				{
					id: '1fe30652-e069-45b5-a929-35ff3fdc02c3',
					sourceNodeId: 'f59ae940-4b23-4f26-aeb2-de4022c9b8e5',
					sourceHandleId: 'api-loader-source-1',
					targetNodeId: 'a8842cc4-88df-4c49-9c8f-bd52055c4bd9',
					targetHandleId: 'format-function-target-1',
					flowId: 'efafbd97-9852-41d0-91b8-950be128926e'
				}
			],
			nodes: [
				{
					id: 'ca97688b-8922-4f6e-aa29-51908d3acbe0',
					nodeType: 'commandInput',
					nodeName: 'commandInput',
					measured: '{"width":250,"height":364}',
					position: '{"x":174,"y":-7}',
					parameters: [
						{
							nodeId: 'ca97688b-8922-4f6e-aa29-51908d3acbe0',
							parameterKey: 'commandName',
							parameterValue: '*exampleFlowWithAuthorization',
							id: 'ef896337-4c43-451f-a5f9-83697c079baf'
						},
						{
							nodeId: 'ca97688b-8922-4f6e-aa29-51908d3acbe0',
							parameterKey: 'options',
							parameterValue: '["offset","limit"]',
							id: 'cb56a287-b647-4129-9a3e-afa60f065da1'
						}
					],
					data: {
						id: ''
					},
					selected: false
				},
				{
					id: 'f59ae940-4b23-4f26-aeb2-de4022c9b8e5',
					nodeType: 'apiLoader',
					nodeName: 'apiLoader',
					measured: '{"width":250,"height":856}',
					position: '{"x":575,"y":-72}',
					parameters: [
						{
							nodeId: 'f59ae940-4b23-4f26-aeb2-de4022c9b8e5',
							parameterKey: 'url',
							parameterValue: 'https://api.spotify.com/v1/artists/1vCWHaC5f2uS3yhpwWbIA6/albums?offset=${offset}&limit=${limit}',
							id: 'ec9df49b-a2e3-46e2-be9b-243dd2bd7e8e'
						},
						{
							nodeId: 'f59ae940-4b23-4f26-aeb2-de4022c9b8e5',
							parameterKey: 'headers',
							parameterValue:
								'{"Authorization":"Bearer BQBaB35SmlgI5P3a8RdyPEzh2Z_bRH7MbB1DtaALJwet9rdURfKSQn35Q_qUBgv5IMpMiCUYbMktD8dS0utlYWHsRtpC5uhkfpkJ7Rz6UQtPCBOSHBE"}',
							id: '773a2879-3e7d-4683-a831-e17d3296d310'
						},
						{
							nodeId: 'f59ae940-4b23-4f26-aeb2-de4022c9b8e5',
							parameterKey: 'method',
							parameterValue: 'GET',
							id: 'f4f5013b-c008-41a9-9541-828255db289a'
						},
						{
							nodeId: 'f59ae940-4b23-4f26-aeb2-de4022c9b8e5',
							parameterKey: 'body',
							parameterValue: '',
							id: '0d71287a-11a5-4098-b16e-d382666858c1'
						},
						{
							nodeId: 'f59ae940-4b23-4f26-aeb2-de4022c9b8e5',
							parameterKey: 'defaultOptions',
							parameterValue: '{"album_type":"SINGLE"}',
							id: '304988eb-e993-4a3e-b5fa-0498bfb42a5e'
						}
					],
					data: {
						id: ''
					},
					selected: false
				},
				{
					id: 'a8842cc4-88df-4c49-9c8f-bd52055c4bd9',
					nodeType: 'formatFunction',
					nodeName: 'formatFunction',
					measured: '{"width":250,"height":486}',
					position: '{"x":960,"y":60}',
					parameters: [
						{
							nodeId: 'a8842cc4-88df-4c49-9c8f-bd52055c4bd9',
							parameterKey: 'variable',
							parameterValue: 'data',
							id: '41151015-345f-41ad-a4a1-574327be9bb6'
						},
						{
							nodeId: 'a8842cc4-88df-4c49-9c8f-bd52055c4bd9',
							parameterKey: 'functionName',
							parameterValue: 'getAlbum',
							id: '614fda1f-a98a-497a-8390-9f1422953bb9'
						},
						{
							nodeId: 'a8842cc4-88df-4c49-9c8f-bd52055c4bd9',
							parameterKey: 'functionBody',
							parameterValue:
								"let title = 'List href or album';\ndata.items.forEach((item) => {\n\ttitle += ` - ${item.href}`;\n});\nreturn title;",
							id: '279fbce6-c24c-4f68-99f3-341a79ec2594'
						}
					],
					data: {
						id: ''
					},
					selected: false
				}
			]
		},
		message: {
			input: '*exampleFlowWithAuthorization',
			output: {
				message: 'hello, this is an example flow \nwith authorization',
				image: []
			}
		}
	},
	{
		id: 'example-flow-4',
		flowName: 'Api loader with method post',
		description: 'This is an example about api loader with method post',
		createdAt: '2025-01-01T00:00:00.000Z',
		updatedAt: '2025-01-01T00:00:00.000Z',
		status: 'active',
		flowDetail: {
			id: '89c19669-073a-40c7-b55a-0a07c4458510',
			userId: 'a08a1932-10cc-479c-8c1c-7b14cde57fd2',
			flowName: 'Api loader with method post',
			description: 'This is an example about api loader with method post',
			connections: [
				{
					id: 'e85f114b-33c9-4728-a671-0dcd3394cabb',
					sourceNodeId: 'c48751ca-7e9b-4df0-80db-3f7b5b401179',
					sourceHandleId: 'command-input-source-1',
					targetNodeId: '44e2fff1-b8eb-426c-9041-ade67bc62660',
					targetHandleId: 'api-loader-target-1',
					flowId: 'ed68d03b-70e3-4008-b45a-7506d33129ef'
				},
				{
					id: '9a4e3426-319d-4e9e-b59d-bd4217b8ab8b',
					sourceNodeId: '44e2fff1-b8eb-426c-9041-ade67bc62660',
					sourceHandleId: 'api-loader-source-1',
					targetNodeId: 'ecafe5ec-0bbf-4ba8-8189-58cc5ed018ec',
					targetHandleId: 'format-function-target-1',
					flowId: 'ed68d03b-70e3-4008-b45a-7506d33129ef'
				}
			],
			nodes: [
				{
					id: 'c48751ca-7e9b-4df0-80db-3f7b5b401179',
					nodeType: 'commandInput',
					nodeName: 'commandInput',
					measured: '{"width":250,"height":364}',
					position: '{"x":176,"y":-70}',
					parameters: [
						{
							nodeId: 'c48751ca-7e9b-4df0-80db-3f7b5b401179',
							parameterKey: 'options',
							parameterValue: '["content"]',
							id: '35993a1e-d0e0-44de-a932-4bedca4b6ca0'
						},
						{
							nodeId: 'c48751ca-7e9b-4df0-80db-3f7b5b401179',
							parameterKey: 'commandName',
							parameterValue: '*exampleFlowWithMethodPost',
							id: 'a2f88d81-7781-4dc8-9cfe-9fb04d0086bf'
						}
					],
					data: {
						id: ''
					},
					selected: false
				},
				{
					id: '44e2fff1-b8eb-426c-9041-ade67bc62660',
					nodeType: 'apiLoader',
					nodeName: 'apiLoader',
					measured: '{"width":250,"height":976}',
					position: '{"x":530,"y":-75}',
					parameters: [
						{
							nodeId: '44e2fff1-b8eb-426c-9041-ade67bc62660',
							parameterKey: 'method',
							parameterValue: 'POST',
							id: 'dee8d3db-aa3a-4e71-953f-086444884c7a'
						},
						{
							nodeId: '44e2fff1-b8eb-426c-9041-ade67bc62660',
							parameterKey: 'defaultOptions',
							parameterValue: '{"key":"AIzaSyDTVdmiRdhEubGEymTBpAjaLPE8xbK"}',
							id: 'a6be6bdd-f5ab-4e5d-91aa-fc833d224dea'
						},
						{
							nodeId: '44e2fff1-b8eb-426c-9041-ade67bc62660',
							parameterKey: 'headers',
							parameterValue: '{}',
							id: 'a1c6209a-eee7-476f-969a-f7d299ba6ce1'
						},
						{
							nodeId: '44e2fff1-b8eb-426c-9041-ade67bc62660',
							parameterKey: 'body',
							parameterValue:
								'{\n    "contents": [\n        {\n            "parts": [\n                {\n                    "text": ${content}\n                }\n            ]\n        }\n    ]\n}',
							id: '0c579d77-ce0b-4970-8640-c215a6ccde98'
						},
						{
							nodeId: '44e2fff1-b8eb-426c-9041-ade67bc62660',
							parameterKey: 'url',
							parameterValue: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
							id: 'fab976f0-a5d6-4cf7-b279-c4b73ee00fd8'
						}
					],
					data: {
						id: ''
					},
					selected: false
				},
				{
					id: 'ecafe5ec-0bbf-4ba8-8189-58cc5ed018ec',
					nodeType: 'formatFunction',
					nodeName: 'formatFunction',
					measured: '{"width":250,"height":474}',
					position: '{"x":869,"y":-8}',
					parameters: [
						{
							nodeId: 'ecafe5ec-0bbf-4ba8-8189-58cc5ed018ec',
							parameterKey: 'variable',
							parameterValue: 'data',
							id: 'a1a45eb4-9f2e-4c8f-874c-8246826ea23b'
						},
						{
							nodeId: 'ecafe5ec-0bbf-4ba8-8189-58cc5ed018ec',
							parameterKey: 'functionName',
							parameterValue: 'getTodo',
							id: '39a06080-ee86-4b8b-bf1d-295dcd2105b6'
						},
						{
							nodeId: 'ecafe5ec-0bbf-4ba8-8189-58cc5ed018ec',
							parameterKey: 'functionBody',
							parameterValue: 'return data.candidates[0].content.parts[0].text;',
							id: '16035151-fbe1-4cda-be25-2daa227351c9'
						}
					],
					data: {
						id: ''
					},
					selected: false
				}
			]
		},
		message: {
			input: '*exampleFlowWithMethodPost',
			output: {
				message: 'Hello! this is example flow \nwith method post',
				image: []
			}
		}
	}
];
export default ExampleFlow;
