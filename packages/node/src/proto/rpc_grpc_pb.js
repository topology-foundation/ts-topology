// GENERATED CODE -- DO NOT EDIT!

import * as node_src_proto_rpc_pb from './rpc_pb.js';

function serialize_topology_rpc_GetCroHashGraphRequest(arg) {
  if (!(arg instanceof node_src_proto_rpc_pb.GetCroHashGraphRequest)) {
    throw new Error('Expected argument of type topology.rpc.GetCroHashGraphRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_topology_rpc_GetCroHashGraphRequest(buffer_arg) {
  return node_src_proto_rpc_pb.GetCroHashGraphRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_topology_rpc_GetCroHashGraphResponse(arg) {
  if (!(arg instanceof node_src_proto_rpc_pb.GetCroHashGraphResponse)) {
    throw new Error('Expected argument of type topology.rpc.GetCroHashGraphResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_topology_rpc_GetCroHashGraphResponse(buffer_arg) {
  return node_src_proto_rpc_pb.GetCroHashGraphResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_topology_rpc_SubscribeCroRequest(arg) {
  if (!(arg instanceof node_src_proto_rpc_pb.SubscribeCroRequest)) {
    throw new Error('Expected argument of type topology.rpc.SubscribeCroRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_topology_rpc_SubscribeCroRequest(buffer_arg) {
  return node_src_proto_rpc_pb.SubscribeCroRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_topology_rpc_SubscribeCroResponse(arg) {
  if (!(arg instanceof node_src_proto_rpc_pb.SubscribeCroResponse)) {
    throw new Error('Expected argument of type topology.rpc.SubscribeCroResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_topology_rpc_SubscribeCroResponse(buffer_arg) {
  return node_src_proto_rpc_pb.SubscribeCroResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_topology_rpc_UnsubscribeCroRequest(arg) {
  if (!(arg instanceof node_src_proto_rpc_pb.UnsubscribeCroRequest)) {
    throw new Error('Expected argument of type topology.rpc.UnsubscribeCroRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_topology_rpc_UnsubscribeCroRequest(buffer_arg) {
  return node_src_proto_rpc_pb.UnsubscribeCroRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


export const TopologyRpcService = {
  subscribeCro: {
    path: '/topology.rpc.TopologyRpc/subscribeCro',
    requestStream: false,
    responseStream: false,
    requestType: node_src_proto_rpc_pb.SubscribeCroRequest,
    responseType: node_src_proto_rpc_pb.SubscribeCroResponse,
    requestSerialize: serialize_topology_rpc_SubscribeCroRequest,
    requestDeserialize: deserialize_topology_rpc_SubscribeCroRequest,
    responseSerialize: serialize_topology_rpc_SubscribeCroResponse,
    responseDeserialize: deserialize_topology_rpc_SubscribeCroResponse,
  },
  unsubscribeCro: {
    path: '/topology.rpc.TopologyRpc/unsubscribeCro',
    requestStream: false,
    responseStream: false,
    requestType: node_src_proto_rpc_pb.UnsubscribeCroRequest,
    responseType: node_src_proto_rpc_pb.UnsubscribeCroRequest,
    requestSerialize: serialize_topology_rpc_UnsubscribeCroRequest,
    requestDeserialize: deserialize_topology_rpc_UnsubscribeCroRequest,
    responseSerialize: serialize_topology_rpc_UnsubscribeCroRequest,
    responseDeserialize: deserialize_topology_rpc_UnsubscribeCroRequest,
  },
  getCroHashGraph: {
    path: '/topology.rpc.TopologyRpc/getCroHashGraph',
    requestStream: false,
    responseStream: false,
    requestType: node_src_proto_rpc_pb.GetCroHashGraphRequest,
    responseType: node_src_proto_rpc_pb.GetCroHashGraphResponse,
    requestSerialize: serialize_topology_rpc_GetCroHashGraphRequest,
    requestDeserialize: deserialize_topology_rpc_GetCroHashGraphRequest,
    responseSerialize: serialize_topology_rpc_GetCroHashGraphResponse,
    responseDeserialize: deserialize_topology_rpc_GetCroHashGraphResponse,
  },
};

// exports.TopologyRpcClient = grpc.makeGenericClientConstructor(TopologyRpcService);
