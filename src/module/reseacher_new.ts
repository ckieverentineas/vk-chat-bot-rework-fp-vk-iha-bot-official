import { tokenizer, tokenizer_sentence } from "..";
import { WordTokenizer, DamerauLevenshteinDistance} from "natural";
import prisma from "./prisma";
import { compareTwoStrings } from 'string-similarity';

function tokenizeText(text: string): string[][] {
    const sentences: string[] = tokenizer_sentence.tokenize(text.toLowerCase());
    const words: string[][] = sentences.map((sentence: string) => tokenizer.tokenize(sentence));
    return words;
  }

async function* Generator_Sentence() {
  const batchSize = 100000;
  let cursor: number | undefined = undefined;
  while (true) {
    const sentences: any = await prisma.answer.findMany({ take: batchSize, skip: cursor ?? 0, cursor: cursor ? { id: cursor } : undefined, orderBy: { id: 'asc' } });
    if (!sentences.length) break;
    yield sentences;
    cursor = sentences[sentences.length - 1].id;
  }
}

function findClosestMatch(query: string, sentences: string[]): { sentence: string, query: string } | undefined {
    const filteredSentences = sentences?.filter(sentence => sentence !== undefined && sentence !== null && sentence.trim() !== '') ?? [];
    if (filteredSentences.length === 0) {
        return undefined;
    }
    const threshold = 0.3;
    query = query.toLowerCase();
    const sentencesLower = filteredSentences.map(sentence => sentence.toLowerCase());
    const matches: { sentence: string, score: number }[] = sentencesLower.map(sentenceLower => {
        const damerauLevenshteinScore = 1 / (DamerauLevenshteinDistance(query, sentenceLower) + 1);
        const cosineScore = compareTwoStrings(query, sentenceLower);
        const score = (damerauLevenshteinScore + cosineScore) / 2;
        return { sentence: sentenceLower, score: score };
    });
    matches.sort((a, b) => b.score - a.score);
    const bestMatch = matches.filter(match => match.score >= threshold)[0];
    if (bestMatch) {
        return { sentence: bestMatch.sentence, query };
    } else {
        return undefined;
    }
}

async function processText(text: string): Promise<{ sentence: string, query: string }[]> {
    const tokenizedText = tokenizeText(text);
    const generator = Generator_Sentence();
    let result: { sentence: string, query: string }[] = [];
    for await (const sentences of generator) {
      const similarities: any = tokenizedText.map(query => findClosestMatch(query.join(" "), sentences.map((sent:any) => sent.qestion))).filter(Boolean);
      if (!similarities.length) continue;
      const similaritiesWithQuery = similarities.map((similarity: { sentence: string, query: string }) => ({ sentence: similarity.sentence, query: similarity.query }));
      result = result.concat(similaritiesWithQuery);
    }
    return result;
  }
  
  async function generateBestSentences(text: string): Promise<{ sentence: string, query: string }[]> {
      const search_all = await processText(text);
      const uniqueQueries = Array.from(new Set(search_all.map(item => item.query)));
      const bestSentences: { sentence: string, query: string }[] = [];
      for (const query of uniqueQueries) {
        const sentences = search_all.filter(item => item.query === query).map(item => item.sentence);
        const bestSentence = findClosestMatch(query, sentences)?.sentence;
        if (bestSentence) { bestSentences.push({ query, sentence: bestSentence }); }
      }
      return bestSentences;
  }
  
async function Engine_Generate_End_Generation(res: { text: string, answer: string, info: string, status: boolean}) {
    const data_old = Date.now()
    const search_best = await generateBestSentences(res.text);
    const answers = [];
    for (const item of search_best) {
        const cond = tokenizer.tokenize(item.sentence).length > 1 ? { qestion: { contains: item.sentence } } : { qestion: item.sentence }
        const answer = await prisma.answer.findMany({ where: cond, take: 100, orderBy: [ {answer: 'desc'}, {qestion: 'asc'} ] });
        if (answer.length > 0) {
            const randomIndex = Math.floor(Math.random() * answer.length);
            answers.push({ id: answer[randomIndex].id, input: item.query, qestion: answer[randomIndex].qestion, answer: answer[randomIndex].answer, crdate: new Date(answer[randomIndex].crdate) });
        }
    }
    if (answers.length > 0) {
        res.answer =  answers.length == 1 ? answers.map(answer => `${answer.answer}\n\n`).join('') : answers.map(answer => `${answer.input}: \n${answer.answer}\n\n`).join('')
        res.info = ` Получено сообщение: [${res.text}] \n Исправление ошибок: [${answers.map(answer => `${answer.id} --> ${answer.qestion}`).join('')}] \n Сгенерирован ответ: [${answers.map(answer => `${answer.id} <-- ${answer.answer}`).join('')}] \n Затраченно времени: [${(Date.now() - data_old)/1000} сек.] \n Откуда ответ: 	     [${"NewBoost"}] \n\n`
        res.status = true
    }
    return res
  }

export default Engine_Generate_End_Generation;