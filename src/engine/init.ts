import { PrismaClient } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { Keyboard, KeyboardBuilder } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";

const prisma = new PrismaClient()

export function InitGameRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
	/*hearManager.hear(/init/, async (context: any) => {
		await prisma.role.create({
			data: {
				name: 'user'
			}
		})
		await prisma.role.create({
			data: {
				name: 'admin'
			}
		})
		console.log(`Init roles for users`)

		context.send('Игра инициализированна успешно.')
	})*/
}