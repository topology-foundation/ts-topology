import * as grpc from "@grpc/grpc-js";

import { TopologyRpcService } from "../proto/rpc_grpc_pb.js";
import type { ServerUnaryCall, sendUnaryData } from "@grpc/grpc-js";
import type {
	SubscribeCroRequest,
	SubscribeCroResponse,
} from "../proto/rpc_pb.js";

function subscribeCro(
	call: ServerUnaryCall<SubscribeCroRequest, SubscribeCroResponse>,
	callback: sendUnaryData<SubscribeCroResponse>,
) {
	const response: SubscribeCroResponse = {
		returnCode: 0,
	};
	callback(null, response);
}

export function init() {
	const server = new grpc.Server();
	server.addService(TopologyRpcService, { subscribeCro });
	server.bindAsync(
		"0.0.0.0:6969",
		grpc.ServerCredentials.createInsecure(),
		(_error, _port) => {
			console.log(_port);
		},
	);
}
