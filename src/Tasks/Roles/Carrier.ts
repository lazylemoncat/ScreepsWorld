export const Carrier = {
  goTransfer: function (creep: Creep, room: Room, 
    target: AnyStoreStructure, transfered: boolean, 
    costs: CostMatrix): boolean {
    const resouceType = Object.keys(creep.store)[0]as ResourceConstant;
    if (resouceType != "energy") {
      if (room.storage == undefined) {
        return false;
      }
      if (creep.transfer(room.storage, resouceType) 
        == ERR_NOT_IN_RANGE) {
        creep.moveTo(room.storage);
        return false;
      }
    }
    if (transfered || creep.transfer(target, resouceType) 
      == ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
      return false;
    }
    if (target.store.getFreeCapacity("energy") >= creep.store[resouceType]) {
      creep.memory.working = false;
    }
    return true;
  },
  goWithdrawEnergy: function (creep: Creep, room: Room, 
      costs: CostMatrix) {
    let amount = creep.store.getFreeCapacity();
    if (amount == 0) {
      return;
    }
    let containers = _.filter(room.find(FIND_STRUCTURES), (i) =>
      i.structureType == "container"
      && (i.store["energy"] >= amount || i.store["energy"] >= 500)
      && i.pos.findInRange(FIND_SOURCES, 2)[0] != undefined
    ) as StructureContainer[];
    let links = _.filter(room.find(FIND_STRUCTURES), (i) =>
      i.structureType == "link"
      && i.store["energy"] >= 100
      && i.pos.findInRange(FIND_SOURCES, 2).length == 0
      && i.pos.getRangeTo(room.controller!) > 3
      && i.pos.getRangeTo(room.find(FIND_MY_SPAWNS)[0]) != 1
    ) as StructureLink[];

    let targets: (StructureTerminal | StructureContainer 
        | StructureStorage | StructureLink)[]
      = [...containers,...links];
    if (room.terminal != undefined) {
      if (room.terminal.store["energy"] >= 100000) {
        targets.push(room.terminal);
      }
    }
    if (targets.length == 0) {
      if (room.storage != undefined) {
        if (room.storage.store["energy"] >= amount) {
          targets.push(room.storage);
        }
      }
    }
    let target = creep.pos.findClosestByRange(targets);
    if (target != undefined) {
      target as (StructureStorage | StructureContainer 
        | Resource<ResourceConstant> | Tombstone);
    } else {
      return;
    }
    if (target instanceof Resource) {
      if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      return;
    } else {
      if (creep.withdraw(target, "energy") == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
    }
    return;
  }
}
