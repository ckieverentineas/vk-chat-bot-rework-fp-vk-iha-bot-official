import { MessageContext } from "vk-io"
import { Anti_Spam_Engine } from "../analyzer/answer_antispam_defender"
import { Call_Me_Controller } from "../analyzer/answer_call_me_controller"
import { User_Say_How_I } from "../analyzer/answer_repeater_say_check"
import { Word_Count_Controller } from "../analyzer/answer_word_count_controller"
import { Re_Answer_controller } from "../analyzer/re_answer_controller"

export async function Analyzer_Core_Edition(context: MessageContext) {
	const antispam_enginge = await Anti_Spam_Engine(context)
	if (antispam_enginge) { return true }
	const answer_repeater_check = await User_Say_How_I(context)
	if (answer_repeater_check) { return true }
	if (context.isChat) {
		const re_answer_check = await Re_Answer_controller(context)
		if (re_answer_check) { return true }
		const word_controller = await Word_Count_Controller(context)
		if (word_controller) { return true }
	}
	const call_me_check = await Call_Me_Controller(context)
	if (call_me_check) { return true }
    return false
}