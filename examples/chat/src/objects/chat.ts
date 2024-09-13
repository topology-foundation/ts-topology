// if it can't compile, append src/index.asc to the import path on runtime
import {
	type GSet,
	gset_add,
	gset_create,
	gset_merge,
} from "@topology-foundation/crdt";
import {
	ActionType,
	type CRO,
	type Operation,
	type ResolveConflictsType,
	SemanticsType,
	type Vertex,
} from "@topology-foundation/object";

export class Chat implements CRO {
	operations: string[] = ["addMessage"];
	semanticsType: SemanticsType = SemanticsType.pair;
	// store messages as strings in the format (timestamp, message, nodeId)
	messages: GSet<string>;
	constructor() {
		this.messages = gset_create<string>();
	}

	addMessage(timestamp: string, message: string, nodeId: string): void {
		this._addMessage(timestamp, message, nodeId);
	}

	private _addMessage(
		timestamp: string,
		message: string,
		nodeId: string,
	): void {
		this.messages.add(`(${timestamp}, ${message}, ${nodeId})`);
	}

	getMessages(): GSet<string> {
		return this.messages;
	}

	merge(other: Chat): void {
		this.messages.merge(other.messages);
	}

	resolveConflicts(vertices: Vertex[]): ResolveConflictsType {
		return { action: ActionType.Nop };
	}

	mergeCallback(operations: Operation[]): void {
		for (const op of operations) {
			const args = op.value as string[];
			this._addMessage(args[0], args[1], args[2]);
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
