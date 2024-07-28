import { TopologyObject } from "@topology-foundation/object";
import { GSet } from "@topology-foundation/crdt";

export interface IChat extends TopologyObject {
    chat: GSet<string>;
    addMessage(timestamp: string, message: string, node_id: string): void;
    getMessages(): GSet<string>;
    merge(other: Chat): void;
}

export class Chat extends TopologyObject implements IChat {
    // store messages as strings in the format (timestamp, message, peerId)
    chat: GSet<string>;

    constructor(peerId: string) {
        super(peerId);
        this.chat = new GSet<string>(new Set<string>());
    }

    addMessage(timestamp: string, message: string, node_id: string): void {
        this.chat.add(`(${timestamp}, ${message}, ${node_id})`);
    }

    getMessages(): GSet<string> {
        return this.chat;
    }

    merge(other: Chat): void {
        this.chat.merge(other.chat);
    }

}
