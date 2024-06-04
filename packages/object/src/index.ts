export abstract class TopologyObject {
  private abi: string;
  private id: string;

  constructor(abi: string) {
    this.abi = abi;
    this.id = "";
  }

  getObjectAbi(): string {
    return this.abi;
  }

  getObjectId(): string {
    return this.id;
  }

  abstract merge(other: TopologyObject): void;
}
