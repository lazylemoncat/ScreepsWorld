
import { SpawnCreep } from "./spawnCreep";
import { Tower } from "../structures/tower";
import { waller } from "./roles/waller";

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
      for (let i = 0; i < structures.length && i < towers.length; ++i) {
        Tower.repair(structures[i], room);
      }
    }
    let wallers = _.filter(Game.creeps, (creep) => creep.memory.role 
      == "waller" && creep.pos.roomName == room.name);
    if (wallers.length < 1) {
      let newListPush = {
        role: "waller",
        bodys: this.returnBodys(room),
      };
      SpawnCreep.newList.push(newListPush);
    }
    if (wallers.length == 0) {
      return;
    }
    
    waller.run(room);
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
    for (let i = 0; i < Math.trunc(times); ++i) {
      bodys.push(WORK, CARRY, MOVE);
    }
    return bodys;
  },
}