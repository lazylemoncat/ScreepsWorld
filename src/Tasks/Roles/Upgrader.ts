import { MyMemory } from "@/memory/myMemory";
import { Withdraw } from "../withdraw";

export const Upgrader = {
  run: function (upgrader: Creep, room: Room) {
    if (MyMemory.upateWorking(upgrader, "energy")) {
      if (this.signController(upgrader, room)) {
        this.upgradeController(upgrader, room);
      }
    } else {
      Withdraw.energy(upgrader, room);
    }
  },
  signController: function (creep: Creep, room: Room): boolean {
    let controller = room.controller;
    if (controller == undefined) {
      return true;
    }
    if (controller.sign == undefined 
      || controller.sign.username != creep.owner.username) {
      if (creep.signController(controller, "should be or not to be")
        == ERR_NOT_IN_RANGE) {
        creep.moveTo(controller);
        return false;
      }
      return true;
    }
    return true;
  },
  upgradeController: function (creep: Creep, room: Room): boolean {
    let controller = room.controller;
    if (controller == undefined) {
      return false;
    }
    if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
      creep.moveTo(controller);
    }
    return true;
  },
}