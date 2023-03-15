interface CreepMemory {
  role: string,
  room: string,
  source?: Id<Source>,
  working?: boolean,
  buildTarget?: Id<ConstructionSite>,
  carrierTarget?: {id: Id<AnyStoreStructure>, type: ResourceConstant},
  container?: Id<StructureContainer>,
  link?: Id<StructureLink>,
  path?: {path: string, id: string, lastPos: {x: number, y: number}, nextPos?: {x: number, y: number}},
}