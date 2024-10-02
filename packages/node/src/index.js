import { NetworkPb, TopologyNetworkNode, } from "@topology-foundation/network";
import { TopologyObject } from "@topology-foundation/object";
import { topologyMessagesHandler } from "./handlers.js";
import * as operations from "./operations.js";
import { TopologyObjectStore } from "./store/index.js";
export class TopologyNode {
    config;
    objectStore;
    networkNode;
    constructor(config) {
        this.config = config;
        this.networkNode = new TopologyNetworkNode(config?.network_config);
        this.objectStore = new TopologyObjectStore();
    }
    async start() {
        await this.networkNode.start();
        this.networkNode.addMessageHandler(["/topology/message/0.0.1"], async ({ stream }) => topologyMessagesHandler(this, stream));
    }
    addCustomGroup(group) {
        this.networkNode.subscribe(group);
    }
    addCustomGroupMessageHandler(group, handler) {
        this.networkNode.addGroupMessageHandler(group, handler);
    }
    sendGroupMessage(group, data) {
        const message = NetworkPb.Message.create({
            sender: this.networkNode.peerId,
            type: NetworkPb.Message_MessageType.CUSTOM,
            data,
        });
        this.networkNode.broadcastMessage(group, message);
    }
    addCustomMessageHandler(protocol, handler) {
        this.networkNode.addMessageHandler(protocol, handler);
    }
    sendCustomMessage(peerId, protocol, data) {
        const message = NetworkPb.Message.create({
            sender: this.networkNode.peerId,
            type: NetworkPb.Message_MessageType.CUSTOM,
            data,
        });
        this.networkNode.sendMessage(peerId, [protocol], message);
    }
    async createObject(cro, id, abi, sync, peerId) {
        const object = new TopologyObject(this.networkNode.peerId, cro, id, abi);
        operations.createObject(this, object);
        operations.subscribeObject(this, object.id);
        if (sync) {
            operations.syncObject(this, object.id, peerId);
        }
        return object;
    }
    async subscribeObject(id) {
        return operations.subscribeObject(this, id);
    }
    unsubscribeObject(id, purge) {
        operations.unsubscribeObject(this, id, purge);
    }
    async syncObject(id, peerId) {
        operations.syncObject(this, id, peerId);
    }
}
