import { MyMemory } from "@/Memory/MyMemory";
import { Withdraw } from "../Withdraw";
import { CostCallBack } from "@/Path/CostCallBack";

export const Builder = {
  run: function (target: ConstructionSite, builder: Creep, room: Room) {
    if (MyMemory.upateWorking(builder, "energy")) {
      this.goBuild(builder, room);
    } else {
      Withdraw.energy(builder, room);
    }
  },
  goBuild: function (creep: Creep, room: Room): void {
    let sites = room.find(FIND_CONSTRUCTION_SITES);
    if (sites.length == 0) {
      return;
    }
    if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
      creep.moveTo(sites[0]);
    }
    return;
  }
}