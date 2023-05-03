import { Repairer } from "./Roles/Repairer";
import { SpawnCreep } from "./SpawnCreep";
import { Tower } from "./Structures/Tower";

export const Repair = {
  run: function (room: Room) {
    let towers = _.filter(room.find(FIND_STRUCTURES), (i) =>
      i.structureType == "tower") as StructureTower[];
    if (towers.length > 0) {
      let structures = room.find(FIND_STRUCTURES).filter(
         i => i.hits < i.hitsMax && i.structureType != STRUCTURE_WALL);
      structures.sort((a,b) => a.hits - b.hits);
      if (structures[0] == undefined) {
        return;
      }
      for (let i = 0; i < structures.length; ++i) {
        Tower.repair(structures[i], room);
      }
      return;
    }
    let repairers = _.filter(Game.creeps, (creep) => creep.memory.role 
      == "repairer" && creep.pos.roomName == room.name);
    if (repairers.length < 1) {
      let newListPush = {
        role: "repairer",
        bodys: this.returnBodys(room),
      };
      SpawnCreep.newList.push(newListPush);
    }
    if (repairers.length == 0) {
      return;
    }
    
    Repairer.run(room);
    return;
  },
  returnBodys: function (room: Room) {
    let energy = room.energyAvailable;
    let bodys = [WORK, CARRY, MOVE];
    if (energy < 300) {
      return bodys;
    }
    const consume = 200;
    let times = (energy - consume) / 200;
    for (let i = 1; i < Math.trunc(times); ++i) {
      bodys.push(WORK, CARRY, MOVE);
    }
    return bodys;
  },
}