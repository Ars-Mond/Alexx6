import TelegramBot from 'node-telegram-bot-api';
import Storage from '@/lib/Storage';

namespace TelegramBotProvider {

	const answer = {
		info: '*Бот RYA* — для отправки уведомлений о событиях нашей инфроструктуры *RYA*\\!',
		ok: '*OK\\.*',
		err: '*ERROR\\!*',
		notFound: '*Not Found\\.*'
	};


	function seeder(str: string) {
		let split = str.slice(1).split(' ');
		return {
			name: split[0],
			parameters: split.filter((value, index, array) => index !== 0)
		}
	}

	function FormatMarkdownV2(rawString: string) {
		const chars = ['_', '*', '[', ']', '(', ')', '~', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];

		let str = rawString;
		for (const char of chars) {
			let reg = new RegExp(`[\\${char}]`, 'g');
			str = str.replace(reg, `\\${char}`);
		}
		return str;
	}

	function FormatTable(arr: Array<any>, title: string, level: number = 0, isArray: boolean = false) {
		let msg = title + '\n';
		function r(count: number, str: string){
			return count > 0 ? str.repeat(count) : '';
		}

		function tap(str: string) {
			return str !== undefined && str !== '' ? str : 'none';
		}

		function form(char: string, item: Array<any>, item2 = '') {

			let t = '';
			let s = r(level, '    ');

			switch (item?.constructor) {
				case Array:
					t = FormatTable(
						item,
						`${s}└ ${item2}:`,
						level + 1);
					break;

				case Object:
					t = FormatTable(
						Object.entries(item),
						`${s}└ ${item2}:`,
						level + 1);
					break;

				default:
					t = `${s}${char} ${item2}: \`${item}\`\n`;
					break;
			}
			return t;
		}


		for (let element of arr.slice(0, -1)) {
			msg += form('├',element[1] ?? element, element[0] ?? '┐');
		}

		let last = arr[arr.length - 1];
		msg += form('└', last[1] ?? last, last[0] ?? '┐');
		return msg;
	}

	export function Listen(token: string, prefix: string) {

		const bot = new TelegramBot(token, {polling: true});

		bot.setMyCommands(
			[{
				command: '/online',
				description: 'Получение онлайна серверов.'
			}]
		).then(r => console.info(`Commands load: ${r}`));

		bot.on('message', async (msg) => {
			try {
				if (!msg.text || !msg.text.startsWith(prefix)) {
					await bot.sendMessage(msg.chat.id, answer.err, {parse_mode: 'MarkdownV2'});
					return;
				}

				let t = seeder(msg.text);

				if (t.name === 'online') {
					let serverArrStr = new Map();

					for (const dataMapElement of Storage.ServerData) {
						let element = dataMapElement[1];

						let servers = Object.entries(element);

						let temp = FormatTable(servers, element.name, 0);


						serverArrStr.set(element.name, temp);
					}

					if (t.parameters.length === 0) {
						let map = Array.from(serverArrStr.values());
						for (let mapElement of map) {
							await bot.sendMessage(msg.chat.id, FormatMarkdownV2(mapElement), {parse_mode: 'MarkdownV2'})
						}
					}

					return;
				}


				await bot.sendMessage(msg.chat.id, answer.err, {parse_mode: 'MarkdownV2'});
			}
			catch (e) {
				console.error(e);
			}
		});

		return bot;
	}
}

export default TelegramBotProvider;