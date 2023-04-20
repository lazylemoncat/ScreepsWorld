import { MyMemory } from "@/Memory/MyMemory";
import { Withdraw } from "../Withdraw";

export const Repairer = {
  run: function (room: Room): void {
    let repairers = _.filter(Game.creeps, (creep) => creep.memory.role 
      == "repairer");
    for (let i = 0; i < repairers.length; ++i) {
      let repairer = repairers[i];
      if (MyMemory.upateWorking(repairer, "energy")) {
        this.goRepair(repairer, room);
      } else {
        Withdraw.energy(repairer, room);
      }
    }
    return;
  },
  goRepair: function (creep: Creep, room: Room): void {
    if (creep.memory.repairTarget != undefined) {
      let target = Game.getObjectById(creep.memory.repairTarget);
      if (target == undefined) {
        creep.memory.repairTarget = undefined;
      } else if (target.hits == target.hitsMax) {
        creep.memory.repairTarget = undefined;
      } else {
        if (creep.repair(target) == ERR_NOT_IN_RANGE) {
          creep.moveTo(target);
        }
        return;
      }
    }
    let structures = room.find(FIND_STRUCTURES).filter(
      i => i.structureType != STRUCTURE_WALL);
    let targets = structures.filter(i => i.hits < i.hitsMax);
    targets.sort((a,b) => a.hits - b.hits);
    if (targets[0] == undefined) {
      return;
    }
    creep.memory.repairTarget = targets[0].id;
    if (creep.repair(targets[0]) == ERR_NOT_IN_RANGE) {
      creep.moveTo(targets[0]);
    }
    return;
  }
}