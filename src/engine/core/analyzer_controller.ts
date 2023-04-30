import { MessageContext } from "vk-io"
import { Anti_Spam_Engine } from "../analyzer/answer_antispam_defender"
import { Call_Me_Controller } from "../analyzer/answer_call_me_controller"
import { User_Say_How_I } from "../analyzer/answer_repeater_say_check"
import { Word_Count_Controller } from "../analyzer/answer_word_count_controller"
import { Re_Answer_controller } from "../analyzer/re_answer_controller"
import { Answer_Alive_Bot_Detector } from "../analyzer/answer_defender_multibot"

export async function Analyzer_Core_Edition(context: MessageContext) {
	//модуль защиты от спамеров, предупреждает тех, кто быстро пишет, пока автоматом не кинет в игнор-лист
	if (await Anti_Spam_Engine(context)) { return true }
	//модуль игнорирующий тех, кто присылает то, что прислал бот в прошлый раз или же дублирующиеся сообщения
	if (await User_Say_How_I(context)) { return true }
	//далее модули класса анализатор специально для бесед.
	if (context.isChat) {
		//модуль, отключающий ботов, когда в беседе больше двух ботов
		if (await Answer_Alive_Bot_Detector(context)) { return true }
		//модуль, позволяющий игнорировать ответы, адресованные не боту
		if (await Re_Answer_controller(context)) { return true }
		//модуль, который решает, когда ответить, т.е. если в сообщении 1 слово и выше, то шанс на ответ 5%, при двух и более - 10%, 3-х и выше, 35%, от 4-х слов - 50%
		if (await Word_Count_Controller(context)) { return true }
	}
	//модуль, который парсит сообщения на упоминания, если есть упоминания и они не адресованы боту, то он игнорирует
	if (await Call_Me_Controller(context)) { return true }
    return false
}