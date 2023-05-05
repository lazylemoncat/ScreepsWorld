import { MyMemory } from "@/memory/myMemory";
import { Withdraw } from "../withdraw"

export const Builder = {
  run: function (builder: Creep, room: Room) {
    if (MyMemory.upateWorking(builder, "energy")) {
      this.goBuild(builder, room);
    } else {
      Withdraw.energy(builder, room);
    }
  },
  goBuild: function (creep: Creep, room: Room): void {
    let sites = room.find(FIND_CONSTRUCTION_SITES);
    if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
      creep.moveTo(sites[0]);
    }
    return;
  },
  // 当没有工地时，自动回去 recycle
  goRecycle: function (creep: Creep, room: Room): void {
    let sites = room.find(FIND_CONSTRUCTION_SITES);
    if (sites.length == 0) {
      let spawn = room.find(FIND_MY_SPAWNS)[0];
      if (spawn.recycleCreep(creep) == ERR_NOT_IN_RANGE) {
        creep.moveTo(spawn);
      }
      return;
    }
  },
}