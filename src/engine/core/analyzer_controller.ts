import { Call_Me_Controller } from "../analyzer/answer_call_me_controller"
import { Word_Count_Controller } from "../analyzer/answer_word_count_controller"
import { Re_Answer_controller } from "../analyzer/re_answer_controller"

export async function Analyzer_Core_Edition(context: any) {
    const call_me_check = await Call_Me_Controller(context.text)
	if (call_me_check) { return true }
	const re_answer_check = await Re_Answer_controller(context)
	if (re_answer_check) { return true }
	const word_controller = await Word_Count_Controller(context)
	if (word_controller) { return true }
    return false
}