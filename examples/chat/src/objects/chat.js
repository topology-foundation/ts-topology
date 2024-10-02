"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const object_1 = require("@topology-foundation/object");
class Chat {
    operations = ["addMessage"];
    semanticsType = object_1.SemanticsType.pair;
    // store messages as strings in the format (timestamp, message, nodeId)
    messages;
    constructor() {
        this.messages = new Set();
    }
    addMessage(timestamp, message, nodeId) {
        this._addMessage(timestamp, message, nodeId);
    }
    _addMessage(timestamp, message, nodeId) {
        this.messages.add(`(${timestamp}, ${message}, ${nodeId})`);
    }
    getMessages() {
        return this.messages;
    }
    resolveConflicts(vertices) {
        return { action: object_1.ActionType.Nop };
    }
    mergeCallback(operations) {
        for (const op of operations) {
            const args = op.value;
            this._addMessage(args[0], args[1], args[2]);
        }
    }
}
exports.Chat = Chat;
