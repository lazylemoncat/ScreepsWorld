import { MyMemory } from "@/memory/myMemory";
import { Withdraw } from "../withdraw";

export const waller = {
  run: function (room: Room): void {
    let wallers = _.filter(Game.creeps, (creep) => creep.memory.role 
      == "waller");
    for (let i = 0; i < wallers.length; ++i) {
      let waller = wallers[i];
      if (MyMemory.upateWorking(waller, "energy")) {
        this.goRepair(waller, room);
      } else {
        Withdraw.energy(waller, room);
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
        i => i.structureType == "constructedWall"
            || i.structureType == "rampart");
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