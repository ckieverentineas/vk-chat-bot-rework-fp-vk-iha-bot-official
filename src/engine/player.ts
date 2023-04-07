import { User } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { IQuestionMessageContext } from "vk-io-question";
import { root, tokenizer, tokenizer_sentence } from '../index';
import { readDir, MultipleReader, MultipleReaderDictionary, MultipleReaderQuestion, MultipleReaderQuestionMod } from "./parser";
import { User_ignore_Check, User_Info, User_Ignore, User_Login, User_Registration, Answer_Duplicate_Clear, Sleep } from './helper';
import prisma from "../module/prisma";
import { randomInt } from "crypto";


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
            const count_dict = await prisma.dictionary.count({})
            const count_couple = await prisma.couple.count({})
            const count_answer = await prisma.answer.count({})
            await context.send(`Панель администратора: \n 👤 Личные сообщения: Разрешены \n 👥 Беседы: Разрешены \n ⚙ Защиты: ✅Антиспам ✅"Я не повторяюсь" \n 📜 Генератор: Слов в словаре, ${count_dict} Парных связей, ${count_couple} \n 📚 Количество вопросов с ответами: ${count_answer}`)
        }
    })
    hearManager.hear(/!помощь/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            await context.send(`☠ Команды бота уже сделанные: \n
                \n⚙ !словарь - пополняет словарный запас бота на все еще не встреченные слова до этого, нужен для нечеткого поиска в базе данных и становления связей*
                \n⚙ !пара - устанавливает парные связи слов на основе существующего словаря и чтения книг*
                \n⚙ !база - считывает тхт формата: Вопрос\\Ответ и все что до второй , остальное нам нафиг не надо. закидывая вопрос-ответы в базу данных
                \n⚙ !базомод - считывает тхт формата: Вопрос \\n Ответ \\r\\n ... Вопрос \\n Ответ \\r\\n закидывая вопрос-ответы в базу данных
                \n⚙ !конфиг - показывает текущую конфигурацию бота
                \n⚙ !мутинг idvk - где idvk, пишем уникальный идентификатор пользователя вк, для включения или отключения режима его игнорирования
                \n⚙ !инфа - выдает информацию о вас и вашем статусе для релевантности бота, конечно вам покажут не все=)
                \n⚙ !юзердроп - удаляет всех пользователей
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
    hearManager.hear(/!юзердроп/, async (context) => {
        if (context.isOutbox == false && context.senderId == root && context?.text != undefined) {
            const user: User[] | null = await prisma.user.findMany({})
            if (user && user.length >= 1) {
                for (const i in user) {
                    const login = await prisma.user.delete({ where: { id: user[i].id } })
                    console.log(`@id${login.idvk}(Пользователь) был удален`)
                }
                await context.send(`⚙ Внимание, было удалено ${user.length}'}`)
            } else {
                await context.send(`⚙ Обидно, но некого удалить... Увы`)
                console.log(`Пользователей не обнаружено`)
            }
        }
    })
    hearManager.hear(/!инфа/, async (context) => {
        const regtrg = await User_Registration(context)
        if (context.isOutbox == false && context?.text != undefined /*&& await User_ignore_Check(context)*/) {
            if (regtrg) { await User_Ignore(context) }
            const bot_memory = await User_Login(context)
            if (!bot_memory) { return }
            const user: User | null = await prisma.user.findFirst({ where: { idvk: context.senderId } })
            const info: any = await User_Info(context)
            if (user) {
                await context.send(` 👤 Имя: @id${user.idvk}(${info.first_name}): \n\n 💳 Порядковый номер: ${user.id} \n 🎥 Кремлевский номер: ${user.idvk} \n ⚠ Получено предупреждений: ${user.warning}/3 \n ⚰ Дата резервации: ${user.crdate} \n ⛓ Статус: ${user.ignore ? 'В стоп-листе' : 'Законопослушны'}`)
            }
        }
    })
    hearManager.hear(/!дубли/, async (context) => {
        if (context.isOutbox == false && context.senderId == root && context?.text != undefined) {
            const counter = await prisma.answer.count({})
            await context.send(`Поиск дубликатов... Сейчас есть ${counter} вопрос-ответов. Не использовать`)
            console.log(`Поиск дубликатов... Сейчас есть ${counter} вопрос-ответов.`)
            //await Answer_Duplicate_Clear(context)
        }
    })
    hearManager.hear(/!проверка/, async (context) => {
        if (context.isOutbox == false && context.senderId == root && context?.text != undefined) {
            const sentence: Array<string> = tokenizer_sentence.tokenize(context.text.toLowerCase())
            const pusher = []
            for (const stce in sentence) {
                //берем предложение
                const sentence_sel: string = sentence[stce]
                const word_list = tokenizer.tokenize(sentence_sel)
                for (let j = 0; j < word_list.length; j++) {
                    pusher.push( { qestion: { contains: word_list[j] } } )
                }
            }
            console.log("🚀 ~ file: player.ts:128 ~ hearManager.hear ~ pusher:", pusher)
            const counter = await prisma.answer.findMany({
                where: {
                    OR: pusher
                },
                take: 10,
                orderBy: 
                    [{answer: 'desc'},
                    {qestion: 'asc'}]
            })
            await context.send(`Найдено на ${context.text} записей: ${counter.length}... ${JSON.stringify(counter).slice(0, 150)}`)
            console.log(`Найдено на ${context.text} --> ${JSON.stringify(counter)}`)
            await Sleep(randomInt(5000, 10000))
            //await Answer_Duplicate_Clear(context)
        }
    })
}


    