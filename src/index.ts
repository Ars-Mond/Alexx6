import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config'

import MonitoringProvider from "@/lib/MonitoringProvider";
import ConfigsProvider from "@/lib/ConfigsProvider";
import Storage from "@/lib/Storage";
import TelegramBotProvider from "@/lib/TelegramBotProvider";

enum ConfigItem {
	TelegramToken = 'token',
	Prefix = 'prefix',
	UrlMonit = 'url_monit'
}

function GetConfigData<T = any>(index: ConfigItem, config: ConfigsProvider.ConfigsList) {
	return config.data.get(index)?.data as T;
}

const tokenConfigElement = new ConfigsProvider.ConfigElement<string>(ConfigItem.TelegramToken,'tgToken', "TG_TOKEN");
const prefixConfigElement = new ConfigsProvider.ConfigElement<string>(ConfigItem.Prefix, 'prefix', 'PREFIX');
const urlMonitConfigElement = new ConfigsProvider.ConfigElement<string>(ConfigItem.UrlMonit, 'urlMonit', 'URL_MONIT');

const config = new ConfigsProvider.ConfigsList([
	tokenConfigElement,
	prefixConfigElement,
	urlMonitConfigElement
]);

const monit = MonitoringProvider.Listen('wss://api.loliland.ru/ws');

const tgBot = TelegramBotProvider.Listen(
	GetConfigData(ConfigItem.TelegramToken, config),
	GetConfigData(ConfigItem.Prefix, config)
);
