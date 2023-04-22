import { tokenizer, tokenizer_sentence } from "..";
import { promises as fsPromises } from 'fs'
import { COPYFILE_EXCL } from "constants";
import { promises as fs } from 'fs'
import prisma from "../module/prisma";
import * as fsfull from 'fs';
import * as readline from 'readline';
import { Spellcheck } from "natural";
import * as _ from 'lodash';

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
/*async function name(file: string) {
    function processData(chunk: any) {
        console.log(`first ${chunk}`)
        setImmediate(() => {
            console.log(`second ${chunk}`);
            setImmediate(() => console.log(`third ${chunk}`));
        });
    }
    var stream = createReadStream(file, { encoding : 'utf8' });
    stream.on("readable", () => processData(stream.read()));
}*/
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
export async function readDir(path: string) {
    try { const files = await fs.readdir(path); return files } catch (err) { console.error(err); }
}
export async function MultipleReader(dir:string, file:string, context: any) {
    const arr: Array<string> = await Book_Random_String(`${dir}/${file}`) || []
    await context.send(`Изучаем книгу: ${file}, строк: ${arr.length}`)
    await Book_Random_Word(arr, context, file)
}
export async function MultipleReaderDictionary(dir:string, file:string, context: any) {
    const arr: Array<string> = await Book_Random_String(`${dir}/${file}`) || []
    await context.send(`Создаем словарь: ${file}, строк: ${arr.length}`)
    await Book_Random_Dictionary(arr, context, file)
}
export async function MultipleReaderQuestion(dir:string, file:string, context: any) {
    const arr: Array<string> = await Book_Random_String_Helper(`${dir}/${file}`) || []
    await context.send(`Создаем списки вопросов и ответов к ним: ${file}, строк: ${arr.length}`)
    await Book_Random_Question(arr, context, file)
}
export async function MultipleReaderQuestionMod(dir:string, file:string, context: any) {
    const arr: Array<string> = await Book_Random_String_Helper_Mod(`${dir}/${file}`) || []
    await context.send(`Создаем списки вопросов и ответов к ним другого формата: ${file}, строк: ${arr.length}`)
    await Book_Random_Question_Mod(arr, context, file)
}

async function Message_Education_Couple(context: any) {
    try {
        const data_old = Date.now()
        const arr_sentence: any = await Message_Education_Sentensce(context?.text?.toLowerCase())
        console.log(`Изучаем предложения сообщения пользователя ${context.senderId} для пар слов: ${arr_sentence?.length} шт.`)
        let count = 0
        let count_circle = 0
        for (const i in arr_sentence) {
            const arr: any = await tokenizer.tokenize(arr_sentence[i])
            const temp: any = arr?.filter((value: any) => value !== undefined && value.length > 0);
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
                            console.log(`Новая пара из сообщения: ${create.id_first}-${word1} > ${create.id_second}-${word2}`)
                            count++
                        }
                    }
                } catch (err) {
                    console.log(`Ошибка ${err}`)
                }
                count_circle++
            }
        }
        console.log(`Прочитано слов из сообщения: ${count_circle}, Пользователь ${context.senderId} добавил новых пар: ${count} Затраченно времени: ${(Date.now() - data_old)/1000} сек.`)
        //await context.send(`✅ Книга связей: ${name_book} Найдено пар: ${count_circle}, Пользователь ${context.senderId} добавил новых пар: ${count} Затраченно времени: ${(Date.now() - data_old)/1000} сек.`)
    } catch (err) {
        console.log(err);
    }
}
async function Message_Education_Dictionary(context: any) {
    try {
        const data_old = Date.now()
        const arr_sentence: any = await Message_Education_Sentensce(context?.text?.toLowerCase())
        console.log(`Изучаем предложения сообщения пользователя ${context.senderId} для словаря: ${arr_sentence?.length} шт.`)
        let count = 0
        let count_circle = 0
        for (const i in arr_sentence) {
            const arr: Array<string> = tokenizer.tokenize(arr_sentence[i])
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
                        console.log(`Новое слово из сообщения: ${create_one.id}-${create_one.word}`)
                        count++
                    }
                } catch (err) {
                    console.log(`Ошибка добавления нового слова из сообщения ${err}`)
                }
                count_circle++
            }
        }
        console.log(`Прочитано слов из сообщения: ${count_circle}, Пользователь ${context.senderId} добавил новых слов: ${count} Затраченно времени: ${(Date.now() - data_old)/1000} сек.`)
        //await context.send(`✅ Книга слов: ${name_book} Найдено слов: ${count_circle}, Сохраненно слов: ${count} Затраченно времени: ${(Date.now() - data_old)/1000} сек.`)
    } catch (err) {
        console.log(err);
    }
}
async function Message_Education_Sentensce(contents: string) {
    try {
        const arr: Array<string> = await tokenizer_sentence.tokenize(contents)
        const clear = arr.filter((value: any) => value !== undefined && value.length > 5);
        return clear;
    } catch (err) {
        console.log(err);
    }
}
export async function Message_Education_Module(context: any) {
    await Message_Education_Dictionary(context)
    await Message_Education_Couple(context)
}
//Новый парсер
interface Answer {
  text: string;
}

interface Question {
  text: string;
  answers: Answer[];
}

// Чтение содержимого файла построчно с помощью потокового чтения
async function readLines(filename: string): Promise<string[]> {
  const fileStream = fsfull.createReadStream(filename);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const lines: string[] = [];

  for await (const line of rl) {
    lines.push(line);
  }

  return lines;
}

// Парсинг содержимого файла
async function parseQuestions(filename: string): Promise<Question[]> {
  const questions: Question[] = [];

  // Чтение содержимого файла построчно
  const lines = await readLines(filename);

  let i = 0;
  while (i < lines.length) {
    const questionText = lines[i];
    i++;

    const answers: Answer[] = [];
    while (i < lines.length && lines[i] !== '') {
      const answerText = lines[i];
      i++;

      const answer: Answer = { text: answerText };
      answers.push(answer);
    }

    const question: Question = { text: questionText, answers };
    questions.push(question);

    i++; // Пропускаем пустую строку между вопросами
  }

  return questions;
}

// Чтение содержимого файла и парсинг вопросов и ответов
/*const filename = 'input.txt';
parseQuestions(filename).then((questions) => {
    console.log(JSON.stringify(questions, null, 2));

});*/

export async function exportData() {
    const answers = await prisma.answer.findMany();
    const data = answers.map((answer, index) => {
      return `${answer.qestion}\n${answer.answer}\n`;
    }).join('\n');
  
    fsfull.writeFileSync('data.txt', data);
}

export async function clearData(filePath: string): Promise<void> {
    const uniqueLines = new Set<string>();
    const spellcheck = new Spellcheck(['ru']);
  
    const readStream = fsfull.createReadStream(filePath, { encoding: 'utf8' });
    const lineReader = readline.createInterface({ input: readStream });
  
    for await (const line of lineReader) {
      const normalizedLine = _.trim(line.toLowerCase().replace(/[^a-zа-я0-9\s]/g, ' '));
      const words = normalizedLine.split(/\s+/).filter((word: string | any[]) => word.length > 0);
      const correctedWords = words.map((word: any) => spellcheck.isCorrect(word) ? word : spellcheck.getCorrections(word)[0] || word);
      const correctedLine = correctedWords.join(' ');
      uniqueLines.add(correctedLine);
    }
  
    const sortedLines = Array.from(uniqueLines).sort();
    console.log(`Количество строк: ${sortedLines.length}`);
    // Если нужно записать результат в файл, можно использовать следующий код:
    await fsfull.promises.writeFile('outputcleared.txt', sortedLines.join('\n'));
  }