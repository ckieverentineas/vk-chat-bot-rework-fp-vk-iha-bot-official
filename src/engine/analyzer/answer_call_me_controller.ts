import { Context, MessageContext } from "vk-io";
import { vks_info } from "../..";

function extractMentions(text: string): Array<{ id: number, name: string, type: "user" | "club" }> {
    const mentionRegExp = /\[(id|club)(\d+)\|([^\]]+)\]/g;
    const mentions: Array<{ id: number, name: string, type: "user" | "club" }> = [];
    let match;
    while ((match = mentionRegExp.exec(text)) !== null) {
      const type = match[1] === "id" ? "user" : "club";
      const id = parseInt(match[2]);
      const name = match[3];
      mentions.push({ id: id, name: name, type: type });
    }
    return mentions;
  }
  
  export async function Call_Me_Controller(context: Context): Promise<boolean> {
    const mentions = extractMentions(context.text || '');
    if (mentions.length === 0) {
      //console.log("Упоминаний не найдено");
      return false;
    }
  
    const ids = vks_info.map((info) => info.idvk);
    for (const mention of mentions) {
      if (ids.includes(mention.id)) {
        //console.log(`Нас упомянули: ${mention.id}`);
        return false;
      }
    }
  
    //console.log("Нас никто не упомянул, вернется false для продолжения");
    return true;
  }