import { User } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { IQuestionMessageContext } from "vk-io-question";
import { root, starting_date } from '../index';
import { User_Access, User_Info} from './helper';
import prisma from "../module/prisma";
import { Prefab_Engine } from './prefab/prefab_engine';
import { Save_Answers_and_Question_In_DB, exportQuestionsAndAnswers } from "./parser";
import { Education_Engine } from "./education/education_egine";
import { Editor_Engine } from "./editor/editor_engine";

export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
    hearManager.hear(/!база/, async (context) => {
        if (context.isOutbox == false && (context.senderId == root || await User_Access(context) == true)) {
            await Save_Answers_and_Question_In_DB(context)

        }
    })
    hearManager.hear(/!конфиг/, async (context) => {
        if (context.isOutbox == false && (context.senderId == root || await User_Access(context) == true)) {
            const count_question = await prisma.question.count({})
            const count_answer = await prisma.answer.count({})
            await context.send(`Панель администратора: \n 🔸 Версия: 0.0.89 Pre-Alpha Building \n 👤 Личные сообщения: Разрешены \n 👥 Беседы: Разрешены \n\n ⚙ Защиты: 🛡Антиспам \n 🛡"Я не повторяюсь" \n 🛡"Ты повторяешься" \n 🛡"Молчать, когда два бота вместе" \n 🛡"Упомянули не меня" \n 🛡"Ответили не мне" \n 🛡"Имунитет от любителей писать одно слово в сообщении" \n 📚 Количество вопросов ${count_question} и ответов к ним: ${count_answer} \n\n 📝 Поисковые движки: \n 🔍 DirectBoost - ищет ответы 1 к 1; \n 🔍 MultiBoost - ищет для кучи предложений нечетко.`)
        }
    })
    hearManager.hear(/!помощь/, async (context) => {
        if (context.isOutbox == false && (context.senderId == root || await User_Access(context) == true)) {
            await context.send(`☠ Команды бота уже сделанные: \n
                \n⚙ !база - считывает тхт формата: \nВопрос\nОтвет\nОтвет\n\nВопрос\nОтвет\n\nВопрос\nОтвет\nОтвет\nОтвет\nОтвет\n\n.....
                \n⚙ !конфиг - показывает текущую конфигурацию бота
                \n⚙ !игнор idvk - где idvk, пишем уникальный идентификатор пользователя вк или упоминаем пользователя, для включения или отключения режима его игнорирования
                \n⚙ !инфа - выдает информацию о вас и вашем статусе для релевантности бота, конечно вам покажут не все=)
                \n⚙ !юзердроп - удаляет всех пользователей
                \n⚙ !дамп - сохраняет txt в корне проекта под названием "questions_and_answers.txt" согласно формату
                \n⚙ !аптайм - показывает время работы с момента запуска бота
                \n⚙ !права idvk - где idvk, пишем уникальный идентификатор пользователя вк или упоминаем пользователя, для выдачи снятия прав администратора
                \n⚙ !обучение - достает неизвестные вопросы, обнаруженные ботом и предлагает их скорректировать и дать ответы на них.
                \n⚙ !редактирование - позволяет по ID вопроса/ответа удалить или скорректировать вопрос/ответ.
                \n💡 В корне проекта должна быть директория (папка) book в которой все txt для загрузки вопросов и ответов к ним в базу данных посредством команды !база.`
            )
        }
    })
    hearManager.hear(/!игнор/, async (context) => {
        if (context.isOutbox == false && (context.senderId == root || await User_Access(context) == true) && context.text) {
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
    hearManager.hear(/!права/, async (context) => {
        if (context.isOutbox == false && (context.senderId == root || await User_Access(context) == true) && context.text) {
            const target: number = Number(context.text.replace(/[^0-9]/g,"")) || 0
            if (target > 0) {
                const user: User | null = await prisma.user.findFirst({ where: { idvk: target } })
                if (user) {
                    const login = await prisma.user.update({ where: { idvk: target }, data: { root: user.root ? false : true } })
                    await context.send(`@id${login.idvk}(Пользователь) ${login.root ? 'добавлен в лист администраторов' : 'убран из листа администраторов'}`)
                    console.log(`@id${login.idvk}(Пользователь) ${login.root ? 'добавлен в лист администраторов' : 'убран из листа администраторов'}`)
                } else {
                    await context.send(`@id${target}(Пользователья) не существует`)
                    console.log(`@id${target}(Пользователья) не существует`)
                }
            }
        }
    })
    hearManager.hear(/!юзердроп/, async (context) => {
        if (context.isOutbox == false && (context.senderId == root || await User_Access(context) == true)) {
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
                await context.send(` 👤 Имя: @id${user.idvk}(${info.first_name}): \n\n 💳 Порядковый номер: ${user.id} \n 🎥 Кремлевский номер: ${user.idvk} \n ⚠ Получено предупреждений: ${user.warning}/3 \n ⚰ Дата резервации: ${user.crdate} \n ⛓ Статус: ${user.ignore ? 'В стоп-листе' : 'Законопослушны'} \n 🔸 Находитесь в капсуле: 0.0.89 Pre-Alpha Building \n `)
            }
        }
    })
    hearManager.hear(/!дамп/, async (context) => {
        if (context.isOutbox == false && (context.senderId == root || await User_Access(context) == true) && context?.text != undefined) {
            await context.send(`Вы запустили процесс слива бд в тхт, давайте начнем`)
            console.log(`Вы запустили процесс слива бд в тхт, давайте начнем`)
            await exportQuestionsAndAnswers()
            await context.send(`Вы завершили процесс слива бд в тхт, ладно`)
            console.log(`Вы завершили процесс слива бд в тхт, ладно`)
        }
    })
    hearManager.hear(/!аптайм/, async (context) => {
        if (context.isOutbox == false && (context.senderId == root || await User_Access(context) == true) && context?.text != undefined) {
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
    hearManager.hear(/!обучение/, async (context) => {
        if (context.isOutbox == false && (context.senderId == root || await User_Access(context) == true) && context?.text != undefined) {
            await context.send(`Внимание, вы в режиме обучения бота!`);
            while (true) {
                const trig = await Education_Engine(context)
                if (!trig) { break }
            }
            
            await context.send(`Обучили`);
        }
    })
    hearManager.hear(/!редактирование/, async (context) => {
        if (context.isOutbox == false && (context.senderId == root || await User_Access(context) == true) && context?.text != undefined) {
            await context.send(`Внимание, вы в режиме редактирования базы данных бота!`);
            while (true) {
                const trig = await Editor_Engine(context)
                if (!trig) { break }
            }
            
            await context.send(`Скорректировали`);
        }
    })
}
