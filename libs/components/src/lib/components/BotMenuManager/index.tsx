import { BotMenuAction, BotMenuItem } from '@mezon/utils';
import { useCallback, useMemo, useState } from 'react';
import BotMenuCustom from '../BotMenuCustom';
import BotSelector from '../BotSelector';

const MOCK_BOT_CONFIGS_JSON = `{
	"bots": [
		{
			"id": "game-bot-001",
			"name": "Slot Bot",
			"avatar": "🎮",
			"description": "Interactive gaming bot with various mini-games",
			"isActive": true,
			"menu": {
				"richMenuId": "game-menu-001",
				"name": "Game Bot Main Menu",
				"chatBarText": "Tap to play games",
				"selected": true,
				"grid": {
					"columns": 4,
					"rows": 1,
					"items": [
						{
							"id": "play-game",
							"label": "Play",
							"action": {
								"type": "message",
								"text": "*slots"
							},
							"backgroundColor": "#4F46E5",
							"textColor": "#FFFFFF"
						},
						{
							"id": "help",
							"label": "Help",
							"action": {
								"type": "message",
								"text": "help"
							},
							"backgroundColor": "#4F46E5",
							"textColor": "#FFFFFF"
						},
						{
							"id": "leaderboard-top5",
							"label": "Top 5",
							"action": {
								"type": "message",
								"text": "leaderboard_top5"
							},
							"backgroundColor": "#4F46E5",
							"textColor": "#FFFFFF"
						},
						{
							"id": "leaderboard-top10",
							"label": "Top 10",
							"action": {
								"type": "message",
								"text": "leaderboard_top10"
							},
							"backgroundColor": "#4F46E5",
							"textColor": "#FFFFFF"
						}
					]
				}
			}
		},
		{
			"id": "music-bot-002",
			"name": "Music Bot",
			"avatar": "🎵",
			"description": "Music streaming and playlist management bot",
			"isActive": true,
			"menu": {
				"richMenuId": "music-menu-001",
				"name": "Music Bot Control",
				"chatBarText": "Control music",
				"selected": false,
				"grid": {
					"columns": 3,
					"rows": 2,
					"items": [
						{
							"id": "play-pause",
							"label": "▶️ Play",
							"action": {
								"type": "message",
								"text": "music_play"
							},
							"backgroundColor": "#10B981",
							"textColor": "#FFFFFF"
						},
						{
							"id": "stop",
							"label": "⏹️ Stop",
							"action": {
								"type": "message",
								"text": "music_stop"
							},
							"backgroundColor": "#EF4444",
							"textColor": "#FFFFFF"
						},
						{
							"id": "next",
							"label": "⏭️ Next",
							"action": {
								"type": "message",
								"text": "music_next"
							},
							"backgroundColor": "#8B5CF6",
							"textColor": "#FFFFFF"
						},
						{
							"id": "queue",
							"label": "📜 Queue",
							"action": {
								"type": "message",
								"text": "music_queue"
							},
							"backgroundColor": "#F59E0B",
							"textColor": "#FFFFFF"
						},
						{
							"id": "volume",
							"label": "🔊 Volume",
							"action": {
								"type": "message",
								"text": "music_volume"
							},
							"backgroundColor": "#6366F1",
							"textColor": "#FFFFFF"
						},
						{
							"id": "playlist",
							"label": "📋 Playlist",
							"action": {
								"type": "uri",
								"uri": "https://music.example.com/playlists"
							},
							"backgroundColor": "#EC4899",
							"textColor": "#FFFFFF"
						}
					]
				}
			}
		},
		{
			"id": "weather-bot-003",
			"name": "Weather Bot",
			"avatar": "🌤️",
			"description": "Real-time weather information and forecasts",
			"isActive": true,
			"menu": {
				"richMenuId": "weather-menu-001",
				"name": "Weather Information",
				"chatBarText": "Get weather info",
				"selected": false,
				"grid": {
					"columns": 2,
					"rows": 3,
					"items": [
						{
							"id": "current-weather",
							"label": "🌡️ Current",
							"action": {
								"type": "message",
								"text": "weather_current"
							},
							"backgroundColor": "#0EA5E9",
							"textColor": "#FFFFFF"
						},
						{
							"id": "forecast",
							"label": "📅 Forecast",
							"action": {
								"type": "message",
								"text": "weather_forecast"
							},
							"backgroundColor": "#0EA5E9",
							"textColor": "#FFFFFF"
						},
						{
							"id": "location",
							"label": "📍 Location",
							"action": {
								"type": "location"
							},
							"backgroundColor": "#22C55E",
							"textColor": "#FFFFFF"
						},
						{
							"id": "alerts",
							"label": "⚠️ Alerts",
							"action": {
								"type": "message",
								"text": "weather_alerts"
							},
							"backgroundColor": "#F97316",
							"textColor": "#FFFFFF"
						},
						{
							"id": "map",
							"label": "🗺️ Map",
							"action": {
								"type": "uri",
								"uri": "https://weather.example.com/map"
							},
							"backgroundColor": "#8B5CF6",
							"textColor": "#FFFFFF"
						},
						{
							"id": "settings",
							"label": "⚙️ Settings",
							"action": {
								"type": "message",
								"text": "weather_settings"
							},
							"backgroundColor": "#6B7280",
							"textColor": "#FFFFFF"
						}
					]
				}
			}
		}
	]
}`;

const parseMockData = () => {
	try {
		return JSON.parse(MOCK_BOT_CONFIGS_JSON);
	} catch (error) {
		console.error('Failed to parse bot configs JSON:', error);
		return { bots: [] };
	}
};

const MOCK_DATA = parseMockData();

export interface BotMenuManagerProps {
	onSendMessage?: (text: string) => void;
	className?: string;
}

export function BotMenuManager({ onSendMessage, className = '' }: BotMenuManagerProps) {
	const activeBots = MOCK_DATA.bots.filter((bot: any) => bot.isActive);
	const [selectedBotId, setSelectedBotId] = useState<string>(activeBots[0]?.id || '');
	const [isMenuVisible, setIsMenuVisible] = useState<boolean>(true);

	const currentBot = useMemo(() => {
		return activeBots.find((bot: any) => bot.id === selectedBotId);
	}, [selectedBotId, activeBots]);

	const currentMenu = useMemo(() => {
		return currentBot?.menu;
	}, [currentBot]);

	const handleBotSelect = useCallback((botId: string) => {
		setSelectedBotId(botId);
	}, []);

	const handleToggleMenu = useCallback(() => {
		setIsMenuVisible(!isMenuVisible);
	}, [isMenuVisible]);

	const handleMenuItemClick = useCallback(
		(action: BotMenuAction, item: BotMenuItem) => {
			if (action.type === 'message' && action.text && onSendMessage) {
				onSendMessage(action.text);
			}
		},
		[onSendMessage, selectedBotId]
	);

	if (activeBots.length === 0) {
		return null;
	}

	return (
		<div className={`bot-menu-manager ${className}`}>
			{isMenuVisible ? (
				<>
					<div className="flex items-center gap-3 mb-3">
						{activeBots.length > 1 ? (
							<BotSelector bots={activeBots} selectedBotId={selectedBotId} onBotSelect={handleBotSelect} />
						) : (
							<div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 flex-1">
								<span className="text-base">{currentBot?.avatar || '🤖'}</span>
								<span>{currentBot?.name}</span>
							</div>
						)}

						<button
							onClick={handleToggleMenu}
							className="flex items-center gap-1.5 px-2 py-1 text-sm rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 group"
							title="Hide bot menu"
						>
							<div className="transition-transform duration-200 group-hover:scale-110">
								<svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
									/>
								</svg>
							</div>
							<span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Hide</span>
						</button>
					</div>

					{currentMenu && (
						<div className="transition-all duration-300 ease-out animate-in slide-in-from-top-2 fade-in-0">
							<BotMenuCustom menu={currentMenu} onMenuItemClick={handleMenuItemClick} />
						</div>
					)}
				</>
			) : (
				<div className="absolute bottom-[58px] right-4 z-50">
					<div className="relative group">
						<button
							onClick={handleToggleMenu}
							className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-[#4F46E5] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 group"
							title={`Show ${currentBot?.name} menu`}
						>
							<span className="text-base transition-transform duration-200 group-hover:scale-110">{currentBot?.avatar || '🤖'}</span>

							<svg className="w-3.5 h-3.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
							</svg>

							<span className="text-xs font-medium hidden group-hover:inline-block transition-all duration-200">Menu</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default BotMenuManager;
