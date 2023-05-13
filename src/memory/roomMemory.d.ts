interface RoomMemory {
  centerLink: Id<StructureLink>;
  labTask: {type: {lab1: string, lab2: string}, amount: number};
  labId: {substrateLabs: [string], reactionLabs: [string]};
  storageTask: {
    [resource: string]: number,
  };
  terminalTask: {
    [resource: string]: number,
  };
  autoSell: {
    [resource: string]: number,
  };
}