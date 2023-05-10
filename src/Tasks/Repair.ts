import { towers } from "../structures/towers";
export const Repair = {
  run: function (room: Room) {
    let roomTowers = _.filter(room.find(FIND_STRUCTURES), (i) =>
      i.structureType == "tower") as StructureTower[];
    if (roomTowers.length > 0) {
      let creep = _.find(room.find(FIND_MY_CREEPS), i => i.hits < i.hitsMax);
      if (creep != undefined) {
        roomTowers[0].heal(creep);
        return;
      }
      let structures = room.find(FIND_STRUCTURES).filter( i => 
          i.hits < i.hitsMax 
          && i.structureType != STRUCTURE_WALL 
          && i.structureType != STRUCTURE_RAMPART
          || (i.structureType == STRUCTURE_RAMPART && i.hits < 1000));
      structures.sort((a,b) => a.hits - b.hits);
      for (let i = 0; i < structures.length && i < roomTowers.length; ++i) {
        towers.repair(structures[i], room);
      }
    }
    return;
  },
}