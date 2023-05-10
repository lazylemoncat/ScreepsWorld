import { MyMemory } from "@/memory/myMemory";
import { SpawnCreep } from "./spawnCreep";
import { Carrier } from "./roles/carrier";
import { links } from "../structures/links";
import { MineralCarrier } from "./roles/mineralCarrier";
import { returnFreeSpawn, spawns } from "../structures/spawns";

export const Transfer = {
  run: function (room: Room, costs: CostMatrix) {
    links.transferEnergy(room);
    let carriers = _.filter(Game.creeps, (creep) => creep.memory.role 
      == "carrier");
    if (carriers.length < 2) {
      this.newCarrier(room);
    }
    let spawnPos = room.find(FIND_MY_SPAWNS)[0].pos;
    let lookForCenterContainers = _.filter(
      room.lookForAtArea(LOOK_STRUCTURES, spawnPos.y - 2, spawnPos.x, 
        spawnPos.y + 2, spawnPos.x + 2, true
      ), i => 
        i.structure.structureType == STRUCTURE_EXTENSION);
    let centerContainers = lookForCenterContainers.map(i => 
      i.structure.id
    );
    let transferTargets = _.filter(room.find(FIND_STRUCTURES), (i) => 
      "store" in i 
      && i.store["energy"] < i.store.getCapacity("energy") 
      && (
        i.structureType == "spawn" 
        || (
          i.structureType == "extension" 
          && i.pos.findInRange(FIND_SOURCES, 2).length == 0
          && !centerContainers.includes(i.id)
        )
        || (i.structureType == "tower" && i.store[RESOURCE_ENERGY] < 600)
        || (i.structureType == "terminal" && i.store["energy"] < 50000)
        || i.structureType == "lab"
        || (i.structureType == "container" 
        && i.store[RESOURCE_ENERGY] < 1500
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
        if (target != null) {
          carrier.say(target.structureType);
        }
        if (!unsplice.includes(target.structureType)) {
            transferTargets.splice(transferTargets.indexOf(target), 1);
        }
        if (Carrier.goTransfer(carrier, room, target, 
          transfered == i, costs)) {
          if (target != room.storage 
              && carrier.store["energy"] 
              - target.store.getFreeCapacity(RESOURCE_ENERGY) >= 0) {
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
    if (!returnFreeSpawn(room)) {
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
    if (energy <= 300) {
      return [CARRY, MOVE];
    }
    let bodys: BodyPartConstant[] = [];
    let carryNum = Math.floor(energy / 100) / 2;
    carryNum = carryNum >= 12 ? 12 : carryNum;
    for (let i = 0; i < carryNum; ++i) {
      bodys.push(CARRY, MOVE);
    }
    return bodys;
  },
  getTransferTask: function (room: Room) {
    
  },
}