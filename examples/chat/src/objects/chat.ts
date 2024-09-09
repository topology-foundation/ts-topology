// if it can't compile, append src/index.asc to the import path on runtime
import {
	type GSet,
	gset_add,
	gset_create,
	gset_merge,
} from "@topology-foundation/crdt";
import {
	ActionType,
	Vertex,
	type CRO,
	type Operation,
} from "@topology-foundation/object";

export class Chat implements CRO<Chat> {
	operations: string[] = ["addMessage"];
	// store messages as strings in the format (timestamp, message, nodeId)
	messages: GSet<string>;
	constructor() {
		this.messages = gset_create<string>();
	}

	addMessage(timestamp: string, message: string, nodeId: string): void {
		this.messages.add(`(${timestamp}, ${message}, ${nodeId})`);
	}

	getMessages(): GSet<string> {
		return this.messages;
	}

	merge(other: Chat): void {
		this.messages.merge(other.messages);
	}

	resolveConflicts(vertices: Vertex<Chat>[]): ActionType {
		return ActionType.Nop;
	}

	mergeCallback(operations: Operation<Chat>[]): void {
		for (const op of operations) {
			console.log(op);
		}
	}
}

export function createChat(): Chat {
	return new Chat();
}

// @ts-ignore
export function addMessage(
	chat: Chat,
	timestamp: string,
	message: string,
	nodeId: string,
): void {
	gset_add(chat.messages, `(${timestamp}, ${message}, ${nodeId})`);
}

// @ts-ignore
export function getMessages(chat: Chat): GSet<string> {
	return chat.messages;
}

// @ts-ignore
export function merge(chat: Chat, other: Chat): void {
	gset_merge(chat.messages, other.messages);
}
