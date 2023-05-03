import { User } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { IQuestionMessageContext } from "vk-io-question";
import { root, starting_date, tokenizer, tokenizer_sentence } from '../index';
import { User_Info, Sleep } from './helper';
import prisma from "../module/prisma";
import { randomInt } from "crypto";
import { Prefab_Engine } from './prefab/prefab_engine';
import { Save_Answers_and_Question_In_DB, exportQuestionsAndAnswers } from "./parser";

export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
    hearManager.hear(/!база/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            await Save_Answers_and_Question_In_DB(context)

        }
    })
    hearManager.hear(/!конфиг/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            const count_question = await prisma.question.count({})
            const count_answer = await prisma.answer.count({})
            await context.send(`Панель администратора: \n 🔸 Версия: 0.0.86 Pre-Alpha Building \n 👤 Личные сообщения: Разрешены \n 👥 Беседы: Разрешены \n\n ⚙ Защиты: 🛡Антиспам \n 🛡"Я не повторяюсь" \n 🛡"Ты повторяешься" \n 🛡"Молчать, когда два бота вместе" \n 🛡"Упомянули не меня" \n 🛡"Ответили не мне" \n 🛡"Имунитет от любителей писать одно слово в сообщении" \n 📚 Количество вопросов ${count_question} и ответов к ним: ${count_answer} \n\n 📝 Поисковые движки: \n 🔍 DirectBoost - ищет ответы 1 к 1; \n 🔍 MultiBoost - ищет для кучи предложений нечетко.`)
        }
    })
    hearManager.hear(/!помощь/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            await context.send(`☠ Команды бота уже сделанные: \n
                \n⚙ !база - считывает тхт формата: \nВопрос\nОтвет\nОтвет\n\nВопрос\nОтвет\n\nВопрос\nОтвет\nОтвет\nОтвет\nОтвет\n\n.....
                \n⚙ !конфиг - показывает текущую конфигурацию бота
                \n⚙ !игнор idvk - где idvk, пишем уникальный идентификатор пользователя вк, для включения или отключения режима его игнорирования
                \n⚙ !инфа - выдает информацию о вас и вашем статусе для релевантности бота, конечно вам покажут не все=)
                \n⚙ !юзердроп - удаляет всех пользователей
                \n⚙ !дамп - сохраняет txt в корне проекта под названием "questions_and_answers.txt" согласно формату
                \n⚙ !аптайм - показывает время работы с момента запуска бота
                \n💡 В корне проекта должна быть директория (папка) book в которой все txt для загрузки вопросов и ответов к ним в базу данных посредством команды !база.`
            )
        }
    })
    hearManager.hear(/!игнор/, async (context) => {
        if (context.isOutbox == false && context.senderId == root && context.text) {
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
        if (context.isOutbox == false && context.senderId == root) {
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
        if (await Prefab_Engine(context)) { return; }
        if (context.isOutbox == false) {
            const user: User | null = await prisma.user.findFirst({ where: { idvk: context.senderId } })
            const info: any = await User_Info(context)
            if (user) {
                await context.send(` 👤 Имя: @id${user.idvk}(${info.first_name}): \n\n 💳 Порядковый номер: ${user.id} \n 🎥 Кремлевский номер: ${user.idvk} \n ⚠ Получено предупреждений: ${user.warning}/3 \n ⚰ Дата резервации: ${user.crdate} \n ⛓ Статус: ${user.ignore ? 'В стоп-листе' : 'Законопослушны'} \n 🔸 Находитесь в капсуле: 0.0.86 Pre-Alpha Building \n `)
            }
        }
    })
    hearManager.hear(/!дамп/, async (context) => {
        if (context.isOutbox == false && context.senderId == root && context?.text != undefined) {
            await context.send(`Вы запустили процесс слива бд в тхт, давайте начнем`)
            console.log(`Вы запустили процесс слива бд в тхт, давайте начнем`)
            await exportQuestionsAndAnswers()
            await context.send(`Вы завершили процесс слива бд в тхт, ладно`)
            console.log(`Вы завершили процесс слива бд в тхт, ладно`)
        }
    })
    hearManager.hear(/!аптайм/, async (context) => {
        if (context.isOutbox == false && context.senderId == root && context?.text != undefined) {
            const now = new Date();
            const diff = now.getTime() - starting_date.getTime();
            const timeUnits = [
                { unit: "дней", value: Math.floor(diff / 1000 / 60 / 60 / 24) },
                { unit: "часов", value: Math.floor((diff / 1000 / 60 / 60) % 24) },
                { unit: "минут", value: Math.floor((diff / 1000 / 60) % 60) },
                { unit: "секунд", value: Math.floor((diff / 1000) % 60) },
            ];
            await context.send(`Время работы: ${timeUnits.filter(({ value }) => value > 0).map(({ unit, value }) => `${value} ${unit}`).join(" ")}`);
        }
    })
}
