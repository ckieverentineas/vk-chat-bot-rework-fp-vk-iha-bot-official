import { User } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { IQuestionMessageContext } from "vk-io-question";
import { root, starting_date, tokenizer, tokenizer_sentence } from '../index';
import { readDir, MultipleReaderQuestion, MultipleReaderQuestionMod, exportData, clearData, parseAndSaveData } from "./parser";
import { User_ignore_Check, User_Info, User_Registration, Sleep } from './helper';
import prisma from "../module/prisma";
import { randomInt } from "crypto";


export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
    hearManager.hear(/!база/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            const dir = `./src/book`
            const file_name: any = await readDir(dir)
            for (const file of file_name) {
                await parseAndSaveData(`${dir}/${file}`, context)
            }
        }
    })
    hearManager.hear(/!конфиг/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            const count_answer = await prisma.answer.count({})
            await context.send(`Панель администратора: \n 🔸 Версия: 0.0.75 Pre-Alpha Building \n 👤 Личные сообщения: Разрешены \n 👥 Беседы: Разрешены \n ⚙ Защиты: ✅Антиспам ✅"Я не повторяюсь" \n 📚 Количество вопросов с ответами: ${count_answer} \n\n 📝 Поисковые движки: \n 🔍 DirectBoost - ищет ответы 1 к 1; \n 🔍 MultiBoost - ищет для кучи предложений нечетко; \n 🔍 SpeedBoost - ищет нечетко самое первое вхождение.`)
        }
    })
    hearManager.hear(/!помощь/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            await context.send(`☠ Команды бота уже сделанные: \n
                \n⚙ !база - считывает тхт формата: Вопрос\\Ответ и все что до второй , остальное нам нафиг не надо. закидывая вопрос-ответы в базу данных
                \n⚙ !конфиг - показывает текущую конфигурацию бота
                \n⚙ !игнор idvk - где idvk, пишем уникальный идентификатор пользователя вк, для включения или отключения режима его игнорирования
                \n⚙ !инфа - выдает информацию о вас и вашем статусе для релевантности бота, конечно вам покажут не все=)
                \n⚙ !юзердроп - удаляет всех пользователей
                \n💡 По пути ./src/book/ кладем в директорию (папку) книгу/answer_database в txt формата, и вначале выполняем команду словарь, по ее окончанию обучение.
                \n💡 Примечание: 1 МБ txt считывается 4+ часа, т.е. при загрузки 1 МБ тхт документа потребуется 4 часа на пополнение словарного запаса, и еще 4 для установления связей на основе полученных слов и их последовательности в книге. А при считывании вопрос-ответ базы данных 6-7 строк в секунду.`
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
        await User_Registration(context)
        if (await User_ignore_Check(context)) { return; }
        if (context.isOutbox == false) {
            const user: User | null = await prisma.user.findFirst({ where: { idvk: context.senderId } })
            const info: any = await User_Info(context)
            if (user) {
                await context.send(` 👤 Имя: @id${user.idvk}(${info.first_name}): \n\n 💳 Порядковый номер: ${user.id} \n 🎥 Кремлевский номер: ${user.idvk} \n ⚠ Получено предупреждений: ${user.warning}/3 \n ⚰ Дата резервации: ${user.crdate} \n ⛓ Статус: ${user.ignore ? 'В стоп-листе' : 'Законопослушны'}`)
            }
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
    hearManager.hear(/!migrate/, async (context) => {
        if (context.isOutbox == false && context.senderId == root && context?.text != undefined) {
            await context.send(`Внимание, запущена одноразовая процедура для миграции +100500 данных, все действия в дальнейшем будут необратимы, бекапиться уже поздняк!`)
            console.log(`Внимание, запущена одноразовая процедура для миграции +100500 данных, все действия в дальнейшем будут необратимы, бекапиться уже поздняк!`)
            const count_answer = await prisma.answer.count({})
            await context.send(`Мы насчитали ${count_answer} записей для пар из Вопросов и Ответов.`)
            console.log(`Мы насчитали ${count_answer} записей для пар из Вопросов и Ответов.`)
            await updateModel(context)
            await context.send(`Первая стадия миграции успешно завершена. Удачи на второй ступени миграций!`)
            console.log(`Первая стадия миграции успешно завершена. Удачи на второй ступени миграций!`)
        }
    })
    hearManager.hear(/!dumping/, async (context) => {
        if (context.isOutbox == false && context.senderId == root && context?.text != undefined) {
            await context.send(`Вы запустили процесс слива бд в тхт, давайте начнем`)
            console.log(`Вы запустили процесс слива бд в тхт, давайте начнем`)
            await exportData()
            await context.send(`Вы завершили процесс слива бд в тхт, ладно`)
            console.log(`Вы завершили процесс слива бд в тхт, ладно`)
        }
    })
    hearManager.hear(/!clever/, async (context) => {
        if (context.isOutbox == false && context.senderId == root && context?.text != undefined) {
            await context.send(`Вы запустили процесс чистки бд в тхт, давайте начнем`)
            console.log(`Вы запустили процесс чистки бд в тхт, давайте начнем`)
            await clearData(`data.txt`)
            await context.send(`Вы завершили процесс чистки бд в тхт, ладно`)
            console.log(`Вы завершили процесс чистки бд в тхт, ладно`)
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
/*async function updateModel(context: any) {
    // Заполняем таблицу Question данными из таблицы Answer
    const distinctQuestions = await prisma.answer.findMany({ distinct: ['qestion'], select: { qestion: true } });
    await context.send(`Из них вопросов является уникальными ${distinctQuestions.length} для записей пар из Вопросов и Ответов.`)
    console.log(`Из них вопросов является уникальными ${distinctQuestions.length} для записей пар из Вопросов и Ответов.`)
    for (const { qestion } of distinctQuestions) { await prisma.question.create({ data: { text: qestion } }) }
    const count_question = await prisma.question.count({})
    await context.send(`Было реорганизовано ${count_question} вопросов.`)
    console.log(`Было реорганизовано ${count_question} вопросов.`)
    // Обновляем таблицу Answer
    const answers = await prisma.answer.findMany();
    let counter = 0
    for (const answer of answers) {
        const question: any = await prisma.question.findUnique({ where: { text: answer.qestion } });
        await prisma.answer.update({ where: { id: answer.id }, data: { id_question: question.id } });
        counter++
    }
    await context.send(`Совершили перепривязку реогранизованных вопросов для ${counter} ответов.`)
    console.log(`Совершили перепривязку реогранизованных вопросов для ${counter} ответов.`)
}  */
async function updateModel(context: any) {
    // Проверяем, есть ли уникальные вопросы в таблице Question
    const existingQuestions = await prisma.question.findMany();
    const existingQuestionTexts = new Set(existingQuestions.map((question) => question.text));
    const distinctQuestions = await prisma.answer.findMany({ distinct: ['qestion'], select: { qestion: true } });
    const newQuestions = distinctQuestions.filter((question) => !existingQuestionTexts.has(question.qestion));
    // Создаем новые вопросы, если они отсутствуют в таблице Question
    let createdQuestions = [];
    if (newQuestions.length > 0) {
        for (const question of newQuestions) {
            const createdQuestion = await prisma.question.create({ data: { text: question.qestion } });
            console.log(`Мигрировал новый вопрос: ${createdQuestion.id} --> ${createdQuestion.text}`)
            createdQuestions.push(createdQuestion);
        }
    }
    await context.send(`Из них вопросов является уникальными ${distinctQuestions.length} для записей пар из Вопросов и Ответов.`);
    console.log(`Из них вопросов является уникальными ${distinctQuestions.length} для записей пар из Вопросов и Ответов.`);
    const countCreatedQuestions = createdQuestions.length;
    await context.send(`Было создано ${countCreatedQuestions} новых вопросов.`);
    console.log(`Было создано ${countCreatedQuestions} новых вопросов.`);
    // Обновляем таблицу Answer
    let updatedAnswersCount = 0;
    for (const answer of await prisma.answer.findMany({ where: { id_question: null } })) {
        const question: any = existingQuestions.find((q) => q.text === answer.qestion) || createdQuestions.find((q) => q.text === answer.qestion);
        if (question) {
            console.log(`Устанавливаем связь для: ${question.text} --> ${question.id} <-- ${answer.id}`)
            await prisma.answer.update({ where: { id: answer.id }, data: { id_question: question.id } });
            updatedAnswersCount++;
        }
    }
    await context.send(`Совершили перепривязку реорганизованных вопросов для ${updatedAnswersCount} ответов.`);
    console.log(`Совершили перепривязку реорганизованных вопросов для ${updatedAnswersCount} ответов.`);
}
