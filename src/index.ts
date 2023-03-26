import { VK } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { QuestionManager, IQuestionMessageContext } from 'vk-io-question';
import { registerUserRoutes } from './engine/player'
import { InitGameRoutes } from './engine/init';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { Call_Me_Controller, Engine_Answer, User_Registration, User_ignore_Check } from './engine/helper';
const natural = require('natural');

dotenv.config()
export const token: string = String(process.env.token)
export const root: number = Number(process.env.root) //root user
export const bot_id: number = Number(process.env.bot_id) //root user
//export const chat_id: number = Number(process.env.chat_id) //chat for logs
//export const group_id: number = Number(process.env.group_id)//clear chat group
export const timer_text = { answerTimeLimit: 300_000 } // ожидать пять минут
export const answerTimeLimit = 300_000 // ожидать пять минут
//авторизация
export const vk = new VK({ token: token, /*pollingGroupId: group_id,*/ apiMode: "sequential", apiLimit: 1 });
//инициализация
const questionManager = new QuestionManager();
const hearManager = new HearManager<IQuestionMessageContext>();

export const tokenizer = new natural.AggressiveTokenizerRu()
export const tokenizer_sentence = new natural.SentenceTokenizer()
/* расскоментировать если интересно наблюдать процессы поиска ответов=)
prisma.$use(async (params, next) => {
	const before = Date.now()
	const result = await next(params)
	const after = Date.now()
	console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
	return result
})
*/

//настройка
vk.updates.use(questionManager.middleware);
vk.updates.on('message_new', hearManager.middleware);

//регистрация роутов из других классов
InitGameRoutes(hearManager)
registerUserRoutes(hearManager)

//миддлевар для предварительной обработки сообщений
vk.updates.on('message_new', async (context: any, next: any) => {
	const regtrg = await User_Registration(context)
	if (context.isOutbox == false && await User_ignore_Check(context) && context.senderId > 0 && context.hasText) {
		if (context.isChat) {
			const call_me_check = await Call_Me_Controller(context)
			if (!call_me_check) { return await next() }
		}
		await Engine_Answer(context,regtrg)
	}
	return await next();
})
vk.updates.start().then(() => {
	console.log('Бот успешно запущен и готов к эксплуатации!')
}).catch(console.log);