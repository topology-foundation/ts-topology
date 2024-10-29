import * as grpc from "@grpc/grpc-js";

import type { ServerUnaryCall, sendUnaryData } from "@grpc/grpc-js";
import type { TopologyNode } from "../index.js";
import { TopologyRpcService } from "../proto/rpc_grpc_pb.js";
import type {
	GetCroHashGraphRequest,
	GetCroHashGraphResponse,
	SubscribeCroRequest,
	SubscribeCroResponse,
	UnsubscribeCroRequest,
	UnsubscribeCroResponse,
} from "../proto/rpc_pb.js";
import { Logger } from "@topology-foundation/logger";

export function init(node: TopologyNode) {
	const log = new Logger("topology::rpc", "info");

	function subscribeCro(
		call: ServerUnaryCall<SubscribeCroRequest, SubscribeCroResponse>,
		callback: sendUnaryData<SubscribeCroResponse>,
	) {
		let returnCode = 0;
		try {
			node.subscribeObject(call.request.croId);
		} catch (e) {
			console.error(e);
			returnCode = 1;
		}

		const response: SubscribeCroResponse = {
			returnCode,
		};
		callback(null, response);
	}

	function unsubscribeCro(
		call: ServerUnaryCall<UnsubscribeCroRequest, UnsubscribeCroResponse>,
		callback: sendUnaryData<UnsubscribeCroResponse>,
	) {
		let returnCode = 0;
		try {
			node.unsubscribeObject(call.request.croId);
		} catch (e) {
			console.error(e);
			returnCode = 1;
		}

		const response: UnsubscribeCroResponse = {
			returnCode,
		};
		callback(null, response);
	}

	function getCroHashGraph(
		call: ServerUnaryCall<GetCroHashGraphRequest, GetCroHashGraphResponse>,
		callback: sendUnaryData<GetCroHashGraphResponse>,
	) {
		const hashes: string[] = [];
		try {
			const object = node.objectStore.get(call.request.croId);
			if (!object) throw Error("cro not found");
			for (const v of object.hashGraph.getAllVertices()) {
				hashes.push(v.hash);
			}
		} catch (e) {
			console.error(e);
		}

		const response: GetCroHashGraphResponse = {
			verticesHashes: hashes,
		};
		callback(null, response);
	}

	const server = new grpc.Server();
	server.addService(TopologyRpcService, {
		subscribeCro,
		unsubscribeCro,
		getCroHashGraph,
	});
	server.bindAsync(
		"0.0.0.0:6969",
		grpc.ServerCredentials.createInsecure(),
		(_error, _port) => {
			log.info("running grpc in port:", _port);
		},
	);
}
