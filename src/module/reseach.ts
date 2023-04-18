import { WordTokenizer, JaroWinklerDistance } from "natural";
import prisma from "./prisma";

function findClosestMatch(query: string, sentences: string[]): string | undefined {
  // Приводим запрос и предложения к нижнему регистру
  query = query.toLowerCase();
  const sentencesLower = sentences.map(sentence => {
    if (typeof sentence === "string") {
      return sentence.toLowerCase();
    } else {
      return "";
    }
  });

  // Разбиваем запрос на отдельные слова
  const tokenizer = new WordTokenizer();
  const queryWords = tokenizer.tokenize(query);

  // Извлекаем контекст из запроса пользователя
  const contextWords = queryWords;

  // Вычисляем схожесть между каждым предложением и запросом,
  // используя функцию JaroWinklerDistance из модуля "natural"
  const matches = sentencesLower.map(sentenceLower => ({
    sentence: sentenceLower,
    score: JaroWinklerDistance(query, sentenceLower, {})
  }));

  // Отбираем только те предложения, которые имеют сходство выше некоторого порога
  const threshold = 0.8;
  const filteredMatches = matches.filter(match => match.score >= threshold);

  // Если нет ни одного предложения, которое имеет достаточное сходство с запросом,
  // возвращаем undefined
  if (filteredMatches.length === 0) {
    return undefined;
  }

  // Находим предложение с наибольшим сходством
  const bestMatch = filteredMatches.reduce((prev, current) => {
    return prev.score > current.score ? prev : current;
  });

  return bestMatch.sentence;
}

async function* Generator_Sentence() {
    const batchSize = 100000;
    let cursor: number | undefined = undefined;
    while (true) {
        const sentences: any = await prisma.answer.findMany({
            take: batchSize,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { id: 'asc' },
        });
        if (!sentences.length) break;
        yield sentences;
        cursor = sentences[sentences.length - 1].id;
    }
}

export async function Analyzer_New_Age(context: any) {
    const word = context.text
    const data_old = Date.now()
    const analyzer = await prisma.answer.findFirst({ where: { qestion: word } });
    if (analyzer) {
        try {
            if (context.isChat) {
                await context.reply(`${analyzer.answer}`) 
            } else {
                await context.send(`${analyzer.answer}`) 
            }
            console.log(` Получено сообщение: [${context.text}] \n Исправление ошибок: [${"v"}] \n Сгенерирован ответ: [${analyzer.answer}] \n Затраченно времени: [${(Date.now() - data_old)/1000} сек.] \n Откуда ответ: 	     [${"Новый ген"}] \n\n`)
            return true;
        } catch (e) {
            console.log(`Проблема отправки сообщения в чат: ${e}`)
            return false;
        }
    }
    const clear = [];
    for await (const sentences of Generator_Sentence()) {
        const temp = sentences.map((sentence: { qestion: any; }) => sentence.qestion);
        const closestMatch = findClosestMatch(word, temp);
        //console.log(closestMatch); // Ожидаемый вывод: "The quick brown fox"
        if (closestMatch) {
            const foundItems = sentences.filter((sentence: any) => sentence.qestion === closestMatch, sentences.answer);
            clear.push(...foundItems);
            break;
        }
    }
    
    if (Array.isArray(clear)) {
        const ans_sel = clear[Math.floor(Math.random() * clear.length)];
        if (ans_sel) { 
            try {
                if (context.isChat) {
                    await context.reply(`${ans_sel.answer}`) 
                } else {
                    await context.send(`${ans_sel.answer}`) 
                }
                console.log(` Получено сообщение: [${context.text}] \n Исправление ошибок: [${ans_sel.qestion}] \n Сгенерирован ответ: [${ans_sel.answer}] \n Затраченно времени: [${(Date.now() - data_old)/1000} сек.] \n Откуда ответ: 	     [${"Новый ген"}] \n\n`)
                return true;
            } catch (e) {
                console.log(`Проблема отправки сообщения в чат: ${e}`)
                return false;
            }
        }
    } else {
        console.log(`Увы подбор не был завершен успешно для ${context.text}`);
        return false;
    }
}