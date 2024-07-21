/* Object and P2P Network messages */
export enum MESSAGES {
  // TODO: Confirm if this needs a network message
  // who to send to?
  /* Create a new CRO */
  CREATE,
  /* Update operation on a CRO */
  UPDATE,

  // These two are not network messages
  /* Subscribe to a PubSub group (either CRO or custom) */
  SUBSCRIBE,
  /* Unsubscribe from a PubSub group */
  UNSUBSCRIBE,

  /* Actively send the CRO RIBLT to a random peer */
  SYNC,
  /* Accept the sync request and send the RIBLT
     after processing the received RIBLT
  */
  SYNC_ACCEPT,
  /* Reject the sync request */
  SYNC_REJECT,
}
