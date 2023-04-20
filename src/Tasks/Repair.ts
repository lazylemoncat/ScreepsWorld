import { SpawnCreep } from "./SpawnCreep";
import { Tower } from "./Structures/Tower";

export const Repair = {
  run: function (room: Room) {
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
    let structures = room.find(FIND_STRUCTURES).filter(
      i => i.structureType != STRUCTURE_WALL);
    let targets = structures.filter(i => i.hits < i.hitsMax);
      targets.sort((a,b) => a.hits - b.hits);
    if (targets[0] == undefined) {
      return;
    }
    for (let i = 0; i < targets.length; ++i) {
      Tower.repair(targets[i], room);
    }
  },
  returnBodys: function (room: Room) {
    let energy = room.energyAvailable;
    let bodys = [WORK, CARRY, MOVE];
    if (energy < 300) {
      return bodys;
    }
    const consume = 150;
    let times = (energy - consume) / 150;
    for (let i = 1; i < times; ++i) {
      bodys.push(WORK, CARRY, MOVE);
    }
    return bodys;
  },
}