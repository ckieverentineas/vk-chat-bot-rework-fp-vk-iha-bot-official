import { tokenizer, tokenizer_sentence } from "..";
import { WordTokenizer, JaroWinklerDistance } from "natural";
import prisma from "./prisma";

function tokenizeText(text: string): string[][] {
  const sentences: string[] = tokenizer_sentence.tokenize(text.toLowerCase());
  const words: string[][] = sentences.map((sentence: string) => tokenizer.tokenize(sentence));
  return words;
}

async function* Generator_Sentence() {
  const batchSize = 100000;
  let cursor: number | undefined = undefined;
  while (true) {
    const sentences: any = await prisma.answer.findMany({
      take: batchSize,
      skip: cursor ?? 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
    });
    if (!sentences.length) break;
    yield sentences;
    cursor = sentences[sentences.length - 1].id;
  }
}

function findClosestMatch(query: string, sentences: string[]): { sentence: string, query: string } | undefined {
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
      score: JaroWinklerDistance( query, sentenceLower, {} ),
    }));
  
    // Сортируем результаты по убыванию схожести
    matches.sort((a, b) => b.score - a.score);
  
    // Находим наилучшее совпадение, учитывая контекст
    const bestMatch = matches.find(match => {
      const matchWords = tokenizer.tokenize(match.sentence);
      const intersection = matchWords.filter(word => contextWords.includes(word));
      return intersection.length > 0;
    });
  
    // Если нашлось хотя бы одно совпадение, возвращаем его
    if (bestMatch) {
      return { sentence: bestMatch.sentence, query: query };
    } else {
      return undefined;
    }
  }

async function processText(text: string): Promise<{ sentence: string, query: string }[]> {
  const tokenizedText = tokenizeText(text);
  const generator = Generator_Sentence();
  let result: { sentence: string, query: string }[] = [];
  for await (const sentences of generator) {
    const similarities: any = tokenizedText.map(query => findClosestMatch(query.join(" "), sentences.map((sent:any) => sent.answer))).filter(Boolean);
    if (!similarities.length) continue;
    const similaritiesWithQuery = similarities.map((similarity: { sentence: string, query: string }) => ({
      sentence: similarity.sentence,
      query: similarity.query
    }));
    result = result.concat(similaritiesWithQuery);
  }
  return result;
}

async function generateBestSentences(text: string): Promise<{ sentence: string, query: string }[]> {
    const search_all = await processText(text); // измененный код
    const uniqueQueries = Array.from(new Set(search_all.map(item => item.query))); // измененный код
    const bestSentences: { sentence: string, query: string }[] = [];
  
    for (const query of uniqueQueries) {
      const sentences = search_all.filter(item => item.query === query).map(item => item.sentence);
      const bestSentence = findClosestMatch(query, sentences)?.sentence;
      if (bestSentence) {
        bestSentences.push({ query, sentence: bestSentence });
      }
    }
  
    return bestSentences;
  }
  async function Engine_Generate_Last_Age(text: string) {
    const search_all = await processText(text);
    const search_best = await generateBestSentences(text); // измененный код
    console.log("🚀 ~ file: reseacher_parallel.ts:103 ~ Engine_Generate_Last_Age ~ search_best:", search_best)
  }

export default Engine_Generate_Last_Age;