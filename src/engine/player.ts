import { PrismaClient } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { send } from "process";
import { Attachment, Context, Keyboard, KeyboardBuilder, PhotoAttachment } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import * as xlsx from 'xlsx';
import { promises as fs } from 'fs'
import { answerTimeLimit, chat_id, prisma, root, timer_text, tokenizer, tokenizer_sentence, vk } from '../index';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from "path";
import { readFileSync, promises as fsPromises } from 'fs'
import { COPYFILE_EXCL } from "constants";

async function Book_Random_String(filename: string) {
    try {
        const contents = await fsPromises.readFile(filename, 'utf-8');
        const arr: Array<string> = await tokenizer_sentence.tokenize(contents)
        //const arr: any = contents.split(/\r?\n/);
        const clear = arr.filter((value: any) => value !== undefined && value.length > 5);
        console.log(`Обнаружено количество предложений: ${clear.length}`)
        return clear;
    } catch (err) {
        console.log(err);
    }
}
async function Book_Random_String_Helper(filename: string) {
    try {
        const contents = await fsPromises.readFile(filename, 'utf-8');
        const arr: Array<string> = contents.split(/\r?\n/)
        //const arr: any = contents.split(/\r?\n/);
        const clear = arr.filter((value: any) => value !== undefined && value.length > 1);
        console.log(`Обнаружено количество предложений: ${clear.length}`)
        return clear;
    } catch (err) {
        console.log(err);
    }
}
async function Book_Random_String_Helper_Mod(filename: string) {
    try {
        const contents = await fsPromises.readFile(filename, 'utf-8');
        const arr: Array<string> = contents.split(/\n\s*\n/)
        //const arr: any = contents.split(/\r?\n/);
        const clear = arr.filter((value: any) => value !== undefined && value.length > 1);
        console.log(`Обнаружено количество предложений: ${clear.length}`)
        return clear;
    } catch (err) {
        console.log(err);
    }
}
async function Book_Random_Word(arr_sentence: Array<string>, context: any, name_book: string) {
    try {
        const data_old = Date.now()
        console.log(`Переданно предложений: ${arr_sentence.length}`)
        let count = 0
        let count_circle = 0
        for (const i in arr_sentence) {
            const arr: Array<string> = await tokenizer.tokenize(arr_sentence[i])
            //const arr: Array<string> = await Az.Tokens(arr_sentence[i]).done();
            //const arr: Array<string> = arr_sentence[i].toLowerCase().replace(/[^а-яА-Я ]/g, "").split(/(?:,| )+/)
            const temp = arr.filter((value: any) => value !== undefined && value.length > 0);
            for (let j = 0; j < temp.length-1; j++) {
                const word1 = temp[j].toLowerCase()
                const word2 = temp[j+1].toLowerCase()
                try {
                    const first: any = await prisma.dictionary.findFirst({ where: { word: word1 }, select: {id: true}})
                    const second: any = await prisma.dictionary.findFirst({ where: { word: word2 }, select: {id: true}})
                    if (first && second) {
                        const check: any = await prisma.couple.findFirst({ where: { id_first: first.id, id_second: second.id, position: j } })
                        if (check) {
                            await prisma.couple.update({ where: { id: check.id }, data: { score: {increment: 1} } })
                        } else {
                            const create = await prisma.couple.create({ data: { id_first: first.id, id_second: second.id, position: j }})
                            console.log(`Set couple: ${create.id_first}-${word1} > ${create.id_second}-${word2}`)
                            count++
                        }
                    }
                } catch (err) {
                    console.log(`Ошибка ${err}`)
                }
                
                count_circle++
            }
        }
        console.log(`Read couple: ${count_circle}, Set new couple: ${count}`)
        await context.send(`✅ Книга связей: ${name_book} Найдено пар: ${count_circle}, Сохраненено пар: ${count} Затраченно времени: ${(Date.now() - data_old)/1000} сек.`)
    } catch (err) {
        console.log(err);
    }
}
async function Book_Random_Dictionary(arr_sentence: Array<string>, context: any, name_book: string) {
    try {
        const data_old = Date.now()
        console.log(`Переданно предложений: ${arr_sentence.length}`)
        let count = 0
        let count_circle = 0
        for (const i in arr_sentence) {
            const arr: Array<string> = tokenizer.tokenize(arr_sentence[i])
            //const arr: Array<string> = await Az.Tokens(arr_sentence[i]).done();
            //const arr: Array<string> = arr_sentence[i].toLowerCase().replace(/[^а-яА-Я ]/g, "").split(/(?:,| )+/)
            const temp = arr.filter((value: any) => value !== undefined && value.length > 0);
            for (let j = 0; j < temp.length; j++) {
                const one = temp[j].toLowerCase()
                try {
                    if (!one) {continue}
                    const find_one = await prisma.dictionary.findFirst({ where: { word: one }})
                    if (find_one) {
                        await prisma.dictionary.update({ where: { word: one }, data: { score: {increment: 1} } })
                    } else {
                        const create_one = await prisma.dictionary.create({ data: { word: one }})
                        console.log(`Add word: ${create_one.id}-${create_one.word}`)
                        count++
                    }
                } catch (err) {
                    console.log(`Ошибка добавления нового слова ${err}`)
                }
                count_circle++
            }
        }
        console.log(`Read words: ${count_circle}, Add words: ${count}`)
        await context.send(`✅ Книга слов: ${name_book} Найдено слов: ${count_circle}, Сохраненно слов: ${count} Затраченно времени: ${(Date.now() - data_old)/1000} сек.`)
    } catch (err) {
        console.log(err);
    }
}
async function Book_Random_Question(arr_sentence: Array<string>, context: any, name_book: string) {
    try {
        const data_old = Date.now()
        console.log(`Переданно предложений: ${arr_sentence.length}`)
        let count = 0
        let count_circle = 0
        for (const i in arr_sentence) {
            const arr: Array<string> = arr_sentence[i].split('\\')
            //const arr: Array<string> = await Az.Tokens(arr_sentence[i]).done();
            //const arr: Array<string> = arr_sentence[i].toLowerCase().replace(/[^а-яА-Я ]/g, "").split(/(?:,| )+/)
            const temp = arr.filter((value: any) => value !== undefined && value.length > 0);
            for (let j = 0; j < temp.length-2; j++) {
                const word1 = temp[j].toLowerCase()
                const word2 = temp[j+1].toLowerCase()
                try {
                    const first: any = await prisma.answer.findFirst({ where: { qestion: word1, answer: word2 }, select: {id: true}})
                    if (!first) {
                        const create = await prisma.answer.create({ data: { qestion: word1, answer: word2 }})
                        console.log(`Add new question: ${create.id} - ${create.qestion} > ${create.answer}`)
                        count++
                    }
                } catch (err) {
                    console.log(`Ошибка ${err}`)
                }
                
                count_circle++
            }
        }
        console.log(`Read couple: ${count_circle}, Set new couple: ${count}`)
        await context.send(`✅ Список вопросов: ${name_book} Найдено вопрсов: ${count_circle}, Добавлено ответов: ${count} Затраченно времени: ${(Date.now() - data_old)/1000} сек.`)
    } catch (err) {
        console.log(err);
    }
}
async function Book_Random_Question_Mod(arr_sentence: Array<string>, context: any, name_book: string) {
    try {
        const data_old = Date.now()
        console.log(`Переданно предложений: ${arr_sentence.length}`)
        let count = 0
        let count_circle = 0
        for (const i in arr_sentence) {
            const arr: Array<string> = arr_sentence[i].split(/\r\n/)
            //const arr: Array<string> = await Az.Tokens(arr_sentence[i]).done();
            //const arr: Array<string> = arr_sentence[i].toLowerCase().replace(/[^а-яА-Я ]/g, "").split(/(?:,| )+/)
            const temp = arr.filter((value: any) => value !== undefined && value.length > 0);
            for (let j = 0; j < temp.length-1; j++) {
                const word1 = temp[j].toLowerCase()
                const word2 = temp[j+1].toLowerCase()
                try {
                    const first: any = await prisma.answer.findMany({ where: { qestion: word1, answer: word2 }})
                    if (first.length < 1) {
                        const create = await prisma.answer.create({ data: { qestion: word1, answer: word2 }})
                        console.log(`Add new question experimental: ${create.id} - ${create.qestion} > ${create.answer}`)
                        count++
                    }
                } catch (err) {
                    console.log(`Ошибка ${err}`)
                }
                
                count_circle++
            }
        }
        console.log(`Read couple: ${count_circle}, Set new couple: ${count}`)
        await context.send(`✅ Список вопросов экспериментальный: ${name_book} Найдено вопрсов: ${count_circle}, Добавлено ответов: ${count} Затраченно времени: ${(Date.now() - data_old)/1000} сек.`)
    } catch (err) {
        console.log(err);
    }
}
async function Move_Book(dir:string, file:string) {
    await fs.copyFile(`${dir}/${file}`, `${dir}/done/${file}`, COPYFILE_EXCL)
    await fs.unlink(`${dir}/${file}`)
}
async function readDir(path: string) {
    try { const files = await fs.readdir(path); return files } catch (err) { console.error(err); }
}
async function MultipleReader(dir:string, file:string, context: any) {
    const arr: Array<string> = await Book_Random_String(`${dir}/${file}`) || []
    await context.send(`Изучаем книгу: ${file}, строк: ${arr.length}`)
    await Book_Random_Word(arr, context, file)
}
async function MultipleReaderDictionary(dir:string, file:string, context: any) {
    const arr: Array<string> = await Book_Random_String(`${dir}/${file}`) || []
    await context.send(`Создаем словарь: ${file}, строк: ${arr.length}`)
    await Book_Random_Dictionary(arr, context, file)
}
async function MultipleReaderQuestion(dir:string, file:string, context: any) {
    const arr: Array<string> = await Book_Random_String_Helper(`${dir}/${file}`) || []
    await context.send(`Создаем списки вопросов и ответов к ним: ${file}, строк: ${arr.length}`)
    await Book_Random_Question(arr, context, file)
}
async function MultipleReaderQuestionMod(dir:string, file:string, context: any) {
    const arr: Array<string> = await Book_Random_String_Helper_Mod(`${dir}/${file}`) || []
    await context.send(`Создаем списки вопросов и ответов к ним другого формата: ${file}, строк: ${arr.length}`)
    await Book_Random_Question_Mod(arr, context, file)
}
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
    hearManager.hear(/!базамод/, async (context) => {
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
            \n⚙ !база - считывает тхт формата: Вопрос\Ответ и все что до второй , остальное нам нафиг не надо. закидывая вопрос-ответы в базу данных
            \n⚙ !базамод - считывает тхт формата: Вопрос \\n Ответ \\r\\n ... Вопрос \\n Ответ \\r\\n закидывая вопрос-ответы в базу данных
            \n⚙ !конфиг - считывает тхт формата: Вопрос\Ответ и все что до второй , остальное нам нафиг не надо. закидывая вопрос-ответы в базу данных
            \n💡 По пути ./src/book/ кладем в директорию (папку) книгу/answer_database в txt формата, и вначале выполняем команду словарь, по ее окончанию обучение.
            \n💡 Примечание: 1 МБ txt считывается 4+ часа, т.е. при загрузки 1 МБ тхт документа потребуется 4 часа на пополнение словарного запаса, и еще 4 для установления связей на основе полученных слов и их последовательности в книге. А при считывании вопрос-ответ базы данных 6-7 строк в секунду.`)
        }
    })
}


    