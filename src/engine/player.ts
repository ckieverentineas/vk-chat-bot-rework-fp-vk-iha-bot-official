import { PrismaClient } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { send } from "process";
import { Attachment, Context, Keyboard, KeyboardBuilder, PhotoAttachment } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import * as xlsx from 'xlsx';

import { answerTimeLimit, chat_id, prisma, root, timer_text, tokenizer, tokenizer_sentence, vk } from '../index';
import { readDir, MultipleReader, MultipleReaderDictionary, MultipleReaderQuestion, MultipleReaderQuestionMod } from "./parser";



export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
    hearManager.hear(/!пара/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            const dir = `./src/book`
            const file_name: any = await readDir(dir)
            for (const file of file_name) {
                await MultipleReader(dir, file, context)
            }
        }
    })
    hearManager.hear(/!словарь/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            const dir = `./src/book`
            const file_name: any = await readDir(dir)
            for (const file of file_name) {
                await MultipleReaderDictionary(dir, file, context)
            }
        }
    })
    hearManager.hear(/!база/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            const dir = `./src/book`
            const file_name: any = await readDir(dir)
            for (const file of file_name) {
                await MultipleReaderQuestion(dir, file, context)
            }
        }
    })
    hearManager.hear(/!базомод/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            const dir = `./src/book`
            const file_name: any = await readDir(dir)
            for (const file of file_name) {
                await MultipleReaderQuestionMod(dir, file, context)
            }
        }
    })
    hearManager.hear(/!конфиг/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            await context.send(`Панель администратора: \n 👤 Личные сообщения: Разрешены \n 👥 Беседы: Разрешены \n ⚙ Защиты отсуствуют`)
        }
    })
    hearManager.hear(/!помощь/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            await context.send(`☠ Команды бота уже сделанные:
                \n⚙ !словарь - пополняет словарный запас бота на все еще не встреченные слова до этого, нужен для нечеткого поиска в базе данных и становления связей*
                \n⚙ !пара - устанавливает парные связи слов на основе существующего словаря и чтения книг*
                \n⚙ !база - считывает тхт формата: Вопрос\\Ответ и все что до второй , остальное нам нафиг не надо. закидывая вопрос-ответы в базу данных
                \n⚙ !базомод - считывает тхт формата: Вопрос \\n Ответ \\r\\n ... Вопрос \\n Ответ \\r\\n закидывая вопрос-ответы в базу данных
                \n⚙ !конфиг - считывает тхт формата: Вопрос\\Ответ и все что до второй , остальное нам нафиг не надо. закидывая вопрос-ответы в базу данных
                \n⚙ !мутинг idvk - где idvk, пишем уникальный идентификатор пользователя вк, для включения или отключения режима его игнорирования
                \n💡 По пути ./src/book/ кладем в директорию (папку) книгу/answer_database в txt формата, и вначале выполняем команду словарь, по ее окончанию обучение.
                \n💡 Примечание: 1 МБ txt считывается 4+ часа, т.е. при загрузки 1 МБ тхт документа потребуется 4 часа на пополнение словарного запаса, и еще 4 для установления связей на основе полученных слов и их последовательности в книге. А при считывании вопрос-ответ базы данных 6-7 строк в секунду.`
            )
        }
    })
    hearManager.hear(/!мутинг/, async (context) => {
        if (context.isOutbox == false && context.senderId == root && context?.text != undefined) {
            const target: number = Number(context.text.replace(/[^0-9]/g,"")) || 0
            if (target > 0) {
                const user: any = await prisma.user.findFirst({ where: { idvk: target } })
                if (user) {
                    const login = await prisma.user.update({ where: { idvk: target }, data: { ignore: user.ignore ? false : true } })
                    await context.send(`@id${login.idvk}(Пользователь) ${login.ignore ? 'добавлен в лист игнора' : 'убран из листа игнора'}`)
                    console.log(`@id${login.idvk}(Пользователь) ${login.ignore ? 'добавлен в лист игнора' : 'убран из листа игнора'}`)
                } else {
                    await context.send(`@id${target}(Пользователья) не существует`)
                    console.log(`@id${target}(Пользователья) не существует`)
                }
            }
        }
    })
}


    