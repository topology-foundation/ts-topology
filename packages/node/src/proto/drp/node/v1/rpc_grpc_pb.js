import * as node_src_proto_rpc_pb from './rpc_pb.js';

function serialize_topology_node_GetCroHashGraphRequest(arg) {
	let encoded = node_src_proto_rpc_pb.GetCroHashGraphRequest.encode(arg).finish()
	return Buffer.from(encoded);
}

function deserialize_topology_node_GetCroHashGraphRequest(buffer_arg) {
  return node_src_proto_rpc_pb.GetCroHashGraphRequest.decode(new Uint8Array(buffer_arg));
}

function serialize_topology_node_GetCroHashGraphResponse(arg) {
	let encoded = node_src_proto_rpc_pb.GetCroHashGraphResponse.encode(arg).finish()
	return Buffer.from(encoded);
}

function deserialize_topology_node_GetCroHashGraphResponse(buffer_arg) {
  return node_src_proto_rpc_pb.GetCroHashGraphResponse.decode(new Uint8Array(buffer_arg));
}

function serialize_topology_node_SubscribeCroRequest(arg) {
	let encoded = node_src_proto_rpc_pb.SubscribeCroRequest.encode(arg).finish()
	return Buffer.from(encoded);
}

function deserialize_topology_node_SubscribeCroRequest(buffer_arg) {
  return node_src_proto_rpc_pb.SubscribeCroRequest.decode(new Uint8Array(buffer_arg));
}

function serialize_topology_node_SubscribeCroResponse(arg) {
	let encoded = node_src_proto_rpc_pb.SubscribeCroResponse.encode(arg).finish()
  return Buffer.from(encoded);
}

function deserialize_topology_node_SubscribeCroResponse(buffer_arg) {
  return node_src_proto_rpc_pb.SubscribeCroResponse.decode(new Uint8Array(buffer_arg));
}

function serialize_topology_node_UnsubscribeCroRequest(arg) {
	let encoded = node_src_proto_rpc_pb.UnsubscribeCroRequest.encode(arg).finish()
	return Buffer.from(encoded);
}

function deserialize_topology_node_UnsubscribeCroRequest(buffer_arg) {
  return node_src_proto_rpc_pb.UnsubscribeCroRequest.decode(new Uint8Array(buffer_arg));
}

function serialize_topology_node_UnsubscribeCroResponse(arg) {
	let encoded = node_src_proto_rpc_pb.UnsubscribeCroResponse.encode(arg).finish()
	return Buffer.from(encoded);
}

function deserialize_topology_node_UnsubscribeCroResponse(buffer_arg) {
  return node_src_proto_rpc_pb.UnsubscribeCroResponse.decode(new Uint8Array(buffer_arg));
}

export const TopologyRpcService = {
  subscribeCro: {
    path: '/topology.node.TopologyRpc/subscribeCro',
    requestStream: false,
    responseStream: false,
    requestType: node_src_proto_rpc_pb.SubscribeCroRequest,
    responseType: node_src_proto_rpc_pb.SubscribeCroResponse,
    requestSerialize: serialize_topology_node_SubscribeCroRequest,
    requestDeserialize: deserialize_topology_node_SubscribeCroRequest,
    responseSerialize: serialize_topology_node_SubscribeCroResponse,
    responseDeserialize: deserialize_topology_node_SubscribeCroResponse,
  },
  unsubscribeCro: {
    path: '/topology.node.TopologyRpc/unsubscribeCro',
    requestStream: false,
    responseStream: false,
    requestType: node_src_proto_rpc_pb.UnsubscribeCroRequest,
    responseType: node_src_proto_rpc_pb.UnsubscribeCroResponse,
    requestSerialize: serialize_topology_node_UnsubscribeCroRequest,
    requestDeserialize: deserialize_topology_node_UnsubscribeCroRequest,
    responseSerialize: serialize_topology_node_UnsubscribeCroResponse,
    responseDeserialize: deserialize_topology_node_UnsubscribeCroResponse,
  },
  getCroHashGraph: {
    path: '/topology.node.TopologyRpc/getCroHashGraph',
    requestStream: false,
    responseStream: false,
    requestType: node_src_proto_rpc_pb.GetCroHashGraphRequest,
    responseType: node_src_proto_rpc_pb.GetCroHashGraphResponse,
    requestSerialize: serialize_topology_node_GetCroHashGraphRequest,
    requestDeserialize: deserialize_topology_node_GetCroHashGraphRequest,
    responseSerialize: serialize_topology_node_GetCroHashGraphResponse,
    responseDeserialize: deserialize_topology_node_GetCroHashGraphResponse,
  },
};
