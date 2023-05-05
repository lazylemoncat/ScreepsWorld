import { MyMemory } from "@/memory/myMemory";
import { SpawnCreep } from "./spawnCreep";
import { Carrier } from "./roles/carrier";
import { Link } from "../structures/links";
import { MineralCarrier } from "./roles/mineralCarrier";
import { Spawns } from "../structures/spawns";

export const Transfer = {
  run: function (room: Room, costs: CostMatrix) {
    Link.transferEnergy(room);
    let carriers = _.filter(Game.creeps, (creep) => creep.memory.role 
      == "carrier");
    if (carriers.length < 2) {
      this.newCarrier(room);
    }
    let transferTargets = _.filter(room.find(FIND_STRUCTURES), (i) => 
        "store" in i 
        && i.store["energy"] < i.store.getCapacity("energy") && (
        i.structureType == "spawn" || (i.structureType == "extension" 
        && i.pos.findInRange(FIND_SOURCES, 2).length == 0)
        || i.structureType == "tower"
        || (i.structureType == "terminal" && i.store["energy"] < 50000)
        || i.structureType == "lab"
        || (i.structureType == "container" 
        && i.pos.findInRange(FIND_SOURCES, 2).length == 0
        && i.pos.findInRange(FIND_MINERALS, 1).length == 0)
      )
    ) as AnyStoreStructure[];
    if (transferTargets.length == 0) {
      if (room.storage != undefined) {
        transferTargets.push(room.storage);
      } else {
        return;
      }
    }
    const unsplice = ["storage"];
    let transfered = -1;

    for (let i = 0; i < carriers.length; ++i) {
      if (i != 0 && transferTargets[0] == undefined) {
        if (room.storage != undefined) {
          transferTargets[0] = room.storage;
        }
      }
      let carrier = carriers[i];
      if (MyMemory.upateWorking(carrier, "energy") 
        && transferTargets[0] != undefined) {
        let target = carrier.pos.
          findClosestByRange(transferTargets) as AnyStoreStructure;
        carrier.say(target.structureType);
        if (!unsplice.includes(target.structureType)) {
            transferTargets.splice(transferTargets.indexOf(target), 1);
        }
        if (Carrier.goTransfer(carrier, room, target, 
          transfered == i, costs)) {
          if (target != room.storage && carrier.store["energy"] != 0) {
            transfered = i;
            --i;
          }
        }
      } else {
        Carrier.goWithdrawEnergy(carrier, room, costs);
      }
    }
    MineralCarrier.run(room);
  },
  newCarrier: function (room: Room) {
    if (Spawns.isFreeSpawn(room) == false) {
      return;
    }
    let newListPush = {
      role: "carrier",
      bodys: this.returnBodys(room),
    }
    SpawnCreep.newList.push(newListPush);
    return;
  },
  returnBodys: function (room: Room): BodyPartConstant[] {
    let energy = room.energyAvailable;
    let bodys = [CARRY, CARRY, MOVE] as BodyPartConstant[];
    if (energy <= 300) {
      bodys = [CARRY, MOVE];
    }
    const consume = 150;
    let times = (energy - consume) / 150;
    for (let i = 1; i < Math.trunc(times); ++i) {
      bodys.push(CARRY, CARRY, MOVE);
    }
    return bodys;
  },
  getTransferTask: function (room: Room) {
    
  },
}