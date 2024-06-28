export function Input_Message_Cleaner(text: string) {
	try {
		return text.replace(/[^а-яА-Я0-9ёЁ \-+—–_•()/\\"'`«»{}[#№\]=:;.,!?...\n\r]/gi, '')
	} catch {
		return ' '
	}
}