import { vks_info } from "../..";

export async function Answer_Alive_Bot_Detector(context: any): Promise<boolean> {
    const ids = vks_info.map((vks) => vks.idvk);
    const chatId = context.peerId - 2e9;
    const members = await context.api.messages.getConversationMembers({
        peer_id: context.peerId,
    });
    const memberIds = members.items.map((member: { member_id: any; }) => member.member_id);
    const matches = memberIds.filter((id: number) => ids.includes(Math.abs(id)));
    return matches.length > 1;
}