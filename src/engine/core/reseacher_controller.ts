import { Context, VK } from "vk-io";
import { Direct_Search } from "../reseacher/reseach_direct_boost"
import Reseacher_New_Format from "../reseacher/reseacher_new_format"

export async function Answer_Core_Edition(res: { text: string, answer: string, info: string, status: boolean }, context: Context, vk: VK) {
	//модуль поиска с прямым вхождением 1 к 1-му
	const dataOld = Date.now();
	if (typeof context.text != 'string') { return res }
	res = await Direct_Search(res, dataOld)
	console.log(`DirectBoost ${res.status ? "{X}" : "{V}"} ${context.senderId} --> ${context.text} <-- ${res.status ? "{Success}" : "{NotFound}"}`)
	res = !res.status ? await Reseacher_New_Format(res, context, dataOld, vk) : res
	console.log(`MultiBoost~  ${res.status ? "{X}" : "{V}"} ${context.senderId} --> ${context.text} <-- ${res.status ? "{Success}" : "{NotFound}"}`)
    return res
}