import { tokenizer, tokenizer_sentence } from "..";
import { promises as fsPromises } from 'fs'
import { COPYFILE_EXCL } from "constants";
import { promises as fsа } from 'fs'
import prisma from "../module/prisma";
import * as fsfull from 'fs';
import { Spellcheck } from "natural";
import * as _ from 'lodash';
import * as fs from 'fs';
import * as readline from 'readline';

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

export async function readDir(path: string) {
    try { const files = await fsа.readdir(path); return files } catch (err) { console.error(err); }
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
  export async function Auto_Corrector_Natural(context: any): Promise<boolean> {
    console.log("🚀 ~ file: parser.ts:409 ~ Auto_Corrector_Natural ~ inputString:", context.text)
    const spellcheck = new Spellcheck(['ru']);
    const words = context.text.split(/\s+/).filter((word: string | any[]) => word.length > 0);
    const correctedWords = words.map((word: any) => spellcheck.isCorrect(word) ? word : spellcheck.getCorrections(word)[0] || word);
    context.text = correctedWords.join(' ');    
    console.log("🚀 ~ file: parser.ts:415 ~ Auto_Corrector_Natural ~ correctedLine:", context.text)
    return true;
}

export async function parseAndSaveData(filename: string, context: any) {
    let counter = { question: 0, answer: 0 };
  
  
    const readInterface = readline.createInterface({
        input: fs.createReadStream(filename, { encoding: 'utf-8' }),
        output: undefined,
        terminal: false,
    });
  
    for await (const line of readInterface) {
      const [questionText, answerText, priority] = line.split('\\');
  
      const existingQuestion = await prisma.question.findUnique({
        where: { text: questionText },
      });
  
      let questionId: number;
  
      if (existingQuestion) {
        questionId = existingQuestion.id;
      } else {
        const newQuestion = await prisma.question.create({
          data: { text: questionText },
        });
        console.log(
          `Добавлен новый вопрос: ${newQuestion.text} <-- ${newQuestion.id}`
        );
        counter.question++;
        questionId = newQuestion.id;
      }
  
      // Проверяем, существует ли ответ для данного вопроса
      const existingAnswer = await prisma.answer.findFirst({
        where: { qestion: questionText, answer: answerText, id_question: questionId },
      });
  
      if (!existingAnswer) {
        const newAnswer = await prisma.answer.create({
          data: { qestion: questionText, answer: answerText, id_question: questionId },
        });
        counter.answer++;
        console.log(
          `Добавлен новый ответ: ${newAnswer.answer} --> ${newAnswer.qestion} <-- ${newAnswer.id}`
        );
      }
    }
  
    console.log(
      `Всего добавлено вопросов: ${counter.question}, ответов: ${counter.answer}`
    );
    await context.send(
      `Добавлено вопросов: ${counter.question}, добавлено ответов: ${counter.answer}`
    );
  }