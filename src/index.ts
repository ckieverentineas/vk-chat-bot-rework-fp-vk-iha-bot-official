import { MessageContext, VK } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { QuestionManager, IQuestionMessageContext } from 'vk-io-question';
import { registerUserRoutes } from './engine/player'
import { InitGameRoutes } from './engine/init';
import { Answer_Core_Edition, Call_Me_Controller, Re_Answer_controller, User_Ignore, User_Login, User_Registration, User_Say, User_ignore_Check, Word_Count_Controller } from './engine/helper';
//import { registerCommandRoutes } from './engine/command';
const natural = require('natural');
import * as dotenv from "dotenv";
dotenv.config();



export const root: number = Number(process.env.root) //root user

//инициализация
const questionManager = new QuestionManager();
const hearManager = new HearManager<IQuestionMessageContext>();

export const tokenizer = new natural.AggressiveTokenizerRu()
export const tokenizer_sentence = new natural.SentenceTokenizer()
/* раскоментировать для того, чтобы лицезреть процесс поиска ответов
prisma.$use(async (params, next) => {
	const before = Date.now()
	const result = await next(params)
	const after = Date.now()
	console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
	return result
})
*/


export interface VKs_Info {
	idvk: number,
	type: string
}
// Определяем тип сущности VK (страница или группа)
type VkEntityType = 'page' | 'group';

// Определяем тип объекта, содержащего информацию о Vk-сущности
type VkEntity = {
	token: string,
	idvk: number,
	type: VkEntityType
};

// Получаем данные обо всех Vk-сущностях из .env файла
const vkEntities: VkEntity[] = JSON.parse(String(process.env.VK_ENTITIES)) || '[]';
// Создаем объект VK для каждой Vk-сущности
export const vks: VK[] = [];
export const vks_info: VKs_Info[] = [];
for (const entity of vkEntities) {
	//авторизация
	const vk = new VK({
		token: entity.token ,
		apiLimit: 1,
		pollingGroupId: entity.type === 'group' ? entity.idvk : undefined,
	});
	vks.push(vk);
	vks_info.push({ idvk: entity.idvk, type: entity.type })
}
for (const vk of vks) {
	//настройка
	vk.updates.use(questionManager.middleware);
	vk.updates.on('message_new', hearManager.middleware);
	vk.updates.use(questionManager.middleware);
	vk.updates.on('message_new', hearManager.middleware);
	//регистрация роутов из других классов
	InitGameRoutes(hearManager)
	registerUserRoutes(hearManager)
	//registerCommandRoutes(hearManager)
	//миддлевар для предварительной обработки сообщений
	vk.updates.on('message_new', async (context: MessageContext, next) => {
		console.log(`Пользователь ${context.senderId} прислал сообщение ${context.text} в ${context.isChat ? "Беседу" : "Личные сообщения"}`)
		const regtrg = await User_Registration(context)
		if (context.hasAttachments("sticker")) { context.text = 'стикер стикер стикер стикер' }
		if (context.isOutbox == false && await User_ignore_Check(context) && context.senderId > 0 && context.text) {
			//может  обвернем в единое окно проверок
			if (regtrg) { await User_Ignore(context) }
			const bot_memory = await User_Login(context)
			if (!bot_memory) { return  await next() }
			if (context.isChat) {
				const call_me_check = await Call_Me_Controller(context.text)
				if (call_me_check) { return await next() }
				const re_answer_check = await Re_Answer_controller(context)
				if (re_answer_check) { return await next() }
				const word_controller = await Word_Count_Controller(context)
				if (word_controller) { return await next() }
			}
			if (await User_Say(context) == false) { return await next() }
			//модуль гена
			let res: { text: string, answer: string, info: string, status: boolean } = await Answer_Core_Edition({ text: context.text, answer: '', info: '', status: false }, context)
			if (!res.status) { console.log(res.info); return await next() }
			try { 
				if (context.isChat) { await context.reply(`${res.answer}`) } else { await context.send(`${res.answer}`) }
				console.log(res.info)
			} catch (e) {
				console.log(`Проблема отправки сообщения в чат: ${e}`) 
			}
		}
		return await next();
	})
	vk.updates.on('wall_reply_new', async (context: any, next: any) => {
		context.senderId = context.fromId
		console.log(`Пользователь ${context.senderId} прислал сообщение ${context.text} на стену группы`)
		const regtrg = await User_Registration(context)
		if (context.hasAttachments("sticker")) { context.text = 'стикер' }
		if (context.fromId > 0 && context.text) {
			const call_me_check = await Call_Me_Controller(context.text)
			if (call_me_check) { return await next() }
			const word_controller = await Word_Count_Controller(context)
			if (word_controller) { return await next() }
			if (await User_Say(context) == false) { return await next() }
			//модуль гена
			let res: { text: string, answer: string, info: string, status: boolean } = await Answer_Core_Edition({ text: context.text, answer: '', info: '', status: false }, context)
			if (!res.status) { console.log(res.info); return await next() }
			try {
				if (context.isWallComment) {
					await context.api.wall.createComment({owner_id: context.ownerId, post_id: context.objectId, reply_to_comment: context.id, guid: context.text, message: `${res.answer}`})
					console.log(res.info)
				}
			} catch (e) {
				console.log(`Проблема отправки сообщения в чат: ${e}`)
			}
		}
		return await next();
	})
	/*vk.updates.on('friend_request', async (context: any, next) => {
		console.log("🚀 ~ file: index.ts:132 ~ vk.updates.on ~ context:", context)
		const { user_id } = context.payload;
		try {
		  await context.api.friends.add({ user_id });
		  console.log(`Пользователь с id ${user_id} успешно добавлен в друзья`);
		} catch (error) {
		  console.error(`Не удалось добавить пользователя с id ${user_id} в друзья`, error);
		}
	  
		return next();
	  });*/
	vk.updates.start().then(() => {
		console.log('Бот успешно запущен и готов к эксплуатации!')
	}).catch(console.log);
}