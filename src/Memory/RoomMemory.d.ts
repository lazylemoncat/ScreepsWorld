interface RoomMemory {
  sources: Id<Source>[],
  harvesters: string[],
  builders: string[],
  upgraders: string[],
  transferers: string[],
  repairers: string[],
  towers: Id<StructureTower>[],
  sites: {init: number},
  isInit: boolean,

  // mineral: Id<Mineral>,
  // controller: Id<StructureController>,
  // structures: Id<AnyStructure>[],
  // spawns: Id<StructureSpawn>[],
  // sites: Id<ConstructionSite>[],
  // containers: Id<StructureContainer>[],
  // towers: Id<StructureTower>[],
  // storage: Id<StructureStorage>,
  // terminal: Id<StructureTerminal>,
  
  // fromLinks: Id<StructureLink>[],
  // toLinks: Id<StructureLink>[],
}