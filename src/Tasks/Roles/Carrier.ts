import { MyMemory } from "@/Memory/MyMemory";

export const Carrier = {
  run: function (room: Room): void {
    let carriers = _.filter(Game.creeps, (creep) => creep.memory.role 
      == "carrier");
    for (let i = 0; i < carriers.length; ++i) {
      let carrier = carriers[i];
      if (MyMemory.upateWorking(carrier, "energy")) {
        this.goTransfer(carrier, room);
      } else {
        this.goWithdrawEnergy(carrier, room);
      }
    }
    return;
  },
  goTransfer: function (creep: Creep, room: Room): void {
    const resouceType = Object.keys(creep.store)[0]as ResourceConstant;
    let amount = creep.store[resouceType];
    if (resouceType != "energy") {
      // todo
      return;
    }
    let extensions = _.filter(room.find(FIND_STRUCTURES), (i) =>
    i.structureType == "extension"
    && i.store.getFreeCapacity("energy") > 0) as StructureExtension[];
    if (extensions[0] != undefined) {
      let extension = creep.pos.findClosestByRange(extensions) as 
        StructureExtension;
      if (creep.transfer(extension, "energy") == ERR_NOT_IN_RANGE) {
        creep.moveTo(extension);
      }
      return;
    }
    let spawns =  _.filter(room.find(FIND_MY_SPAWNS), (i) =>
    i.structureType == "spawn"
    && i.store.getFreeCapacity("energy") > 0) as StructureSpawn[];
    if (spawns[0] != undefined) {
      if (creep.transfer(spawns[0], "energy") == ERR_NOT_IN_RANGE) {
        creep.moveTo(spawns[0]);
      }
      return;
    }
    let towers =  _.filter(room.find(FIND_STRUCTURES), (i) =>
      i.structureType == "tower"
      && i.store.getFreeCapacity("energy") > 0) as StructureTower[];
    if (towers[0] != undefined) {
      if (creep.transfer(towers[0], "energy") == ERR_NOT_IN_RANGE) {
        creep.moveTo(towers[0]);
      }
      return;
    }
    let containers = _.filter(room.find(FIND_STRUCTURES), (i) =>
      i.structureType == "container"
      && i.store.getFreeCapacity("energy") > 0
      && i.pos.findInRange(FIND_SOURCES, 1)[0] == undefined
      && i.pos.findInRange(FIND_MINERALS, 1)[0] == undefined) as 
      StructureContainer[];
    if (containers[0] != undefined) {
      let container = creep.pos.findClosestByRange(containers) as 
        StructureContainer;
      if (creep.transfer(container, "energy") == ERR_NOT_IN_RANGE) {
        creep.moveTo(container);
      }
      return;
    }
    return;
  },
  goWithdrawEnergy: function (creep: Creep, room: Room) {
    let amount = creep.store.getFreeCapacity();
    let containers = _.filter(room.find(FIND_STRUCTURES), (i) =>
      i.structureType == "container"
      && i.store["energy"] >= amount
      && i.pos.findInRange(FIND_SOURCES, 1)[0] != undefined) as 
      StructureContainer[];
    if (containers[0] != undefined) {
      let container = creep.pos.findClosestByRange(containers) as 
        StructureContainer;
      if (creep.withdraw(container, "energy") == ERR_NOT_IN_RANGE) {
        creep.moveTo(container);
      }
    }
    return;
  }
}