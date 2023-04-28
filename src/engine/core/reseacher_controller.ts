import { Direct_Search } from "../reseacher/reseach_direct_boost"
import { Analyzer_New_Age } from "../reseacher/reseach_speed_boost"
import Engine_Generate_Last_Age from "../reseacher/reseacher_multi_boost"

export async function Answer_Core_Edition(res: { text: string, answer: string, info: string, status: boolean }, context: any) {
	res = await Direct_Search(res)
	console.log(`DirectBoost ${res.status ? "{X}" : "{V}"} ${context.senderId} --> ${context.text} <-- ${res.status ? "{Success}" : "{NotFound}"}`)
    /*res = !res.status ? await Engine_Generate_End_Generation(res) : res
    console.log(`NewBoost  ${res.status ? "{X}" : "{V}"} ${context.senderId} --> ${context.text} <-- ${res.status ? "{Success}" : "{NotFound}"}`)*/
	res = !res.status ? await Engine_Generate_Last_Age(res) : res
	console.log(`MultiBoost  ${res.status ? "{X}" : "{V}"} ${context.senderId} --> ${context.text} <-- ${res.status ? "{Success}" : "{NotFound}"}`)
	res = !res.status ? await Analyzer_New_Age(res) : res
	console.log(`SpeedBoost  ${res.status ? "{X}" : "{V}"} ${context.senderId} --> ${context.text} <-- ${res.status ? "{Success}" : "{NotFound}"}`)
    return res
}