import { WordTokenizer, JaroWinklerDistance } from "natural";
import prisma from "./prisma";
import { Answer } from "@prisma/client";

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

export async function Analyzer_New_Age(res: { text: string, answer: string, info: string, status: boolean}) {
    const data_old = Date.now()
    const clear = [];
    for await (const sentences of Generator_Sentence()) {
        const temp = sentences.map((sentence: { qestion: any; }) => sentence.qestion);
        const closestMatch = findClosestMatch(res.text, temp);
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
            res.answer = ans_sel.answer
            res.info = ` Получено сообщение: [${res.text}] \n Исправление ошибок: [${ans_sel.qestion}] \n Сгенерирован ответ: [${ans_sel.answer}] \n Затраченно времени: [${(Date.now() - data_old)/1000} сек.] \n Откуда ответ: 	     [${"SpeedBoost"}] \n\n`
            res.status = true
        }
    }
    return res
}