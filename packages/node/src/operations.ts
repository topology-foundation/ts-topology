/* Object and P2P Network operations */
export enum OPERATIONS {
	// TODO: Confirm if this needs a network message
	// who to send to?
	/* Create a new CRO */
	CREATE = 0,
	/* Update operation on a CRO */
	UPDATE = 1,

	// These two are not network messages
	/* Subscribe to a PubSub group (either CRO or custom) */
	SUBSCRIBE = 2,
	/* Unsubscribe from a PubSub group */
	UNSUBSCRIBE = 3,

	/* Actively send the CRO RIBLT to a random peer */
	SYNC = 4,
	/* Accept the sync request and send the RIBLT
     after processing the received RIBLT
  */
	SYNC_ACCEPT = 5,
	/* Reject the sync request */
	SYNC_REJECT = 6,
}
