import { root } from "..";
import prisma from "../module/prisma";
import { Input_Message_Cleaner } from "./clear_input";
import { Answer_Core_Edition } from "./core/reseacher_controller";
import { Sleep } from "./helper";
import { Direct_Search } from "./reseacher/reseach_direct_boost";
import Reseacher_New_Format from "./reseacher/reseacher_new_format";
import { Replacer_System_Params } from "./reseacher/specializator";

export async function Answer_Offline(vk: any) {
    await vk.api.messages.send({
        peer_id: root,
        random_id: 0,
        message: `Приступаем к считыванию оффлайн сообщений!`
    });
    const messages = await vk.api.messages.getConversations({
        filter: 'unread'
    });
    
    const unreadMessages = messages.items;
    
    if (unreadMessages.length > 0) {
        for (const message of unreadMessages) {
            //console.log(message)
            if (message.last_message.text == '') { continue }
            await Sleep(Math.floor(Math.random() * (50000 - 10000 + 1)) + 10000)
            const peerId = message.conversation.peer.id;
            const context = {
                senderId: message.conversation.peer.id,
                text: message.last_message.text
            }
            //модуль поиска с прямым вхождением 1 к 1-му
	        const dataOld = Date.now();
            let res: { text: string; answer: string; info: string; status: boolean; } = { text: context.text, answer: '', info: '', status: false }
	        res = await Direct_Search(res, dataOld)
	        console.log(`DirectBoost Offline ${res.status ? "{X}" : "{V}"} ${context.senderId} --> ${context.text} <-- ${res.status ? "{Success}" : "{NotFound}"}`)
	        res = !res.status ? await Reseacher_New_Format(res, context, dataOld, vk) : res
	        console.log(`MultiBoost~ Offline ${res.status ? "{X}" : "{V}"} ${context.senderId} --> ${context.text} <-- ${res.status ? "{Success}" : "{NotFound}"}`)
            //ищем самый оптимальный вариант ответа на сообщение пользователя
			
			if (!res.status) { console.log(res.info); continue; }
			try {
				//отправляем оптимальный ответ пользователю
                // Отправляем ответное сообщение
                await vk.api.messages.send({
                    peer_id: peerId,
                    random_id: 0,
                    message: `Привет я снова в сети, ты пишешь: ${Input_Message_Cleaner(message.last_message.text)}, мой ответ: ${res.answer}`
                });
				console.log(res.info);
			} catch (e) {
				console.log(`Проблема отправки сообщения в чат: ${e}`);
			}
        }
    }
    await vk.api.messages.send({
        peer_id: root,
        random_id: 0,
        message: `Закончили считывать оффлайн сообщений!`
    });
}