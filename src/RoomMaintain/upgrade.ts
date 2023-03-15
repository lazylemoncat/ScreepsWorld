export const upgrade = {
  run: function(room: Room): void {
    for (let i = 0; i < room.memory.upgraders.length; i++) {
      let upgrader = Game.creeps[room.memory.upgraders[i]];
      if (upgrader == null) {
        Memory.creepsNum--;
        continue;
      }
      if(upgrader.memory.working && upgrader.store[RESOURCE_ENERGY] == 0) {
        upgrader.memory.working = false;
      } else if(!upgrader.memory.working && upgrader.store.getFreeCapacity() == 0) {
        upgrader.memory.working = true;
      }

      if(upgrader.memory.working) {
        goUpgrade(upgrader, room);
      } else {
        goGetEnergy(upgrader, room);
      }
    }
  }
}

function goUpgrade(creep: Creep, room: Room): void {
  if (room.controller == undefined) {
    return;
  }
  creep.upgradeController(room.controller)
  creep.myMove(room.controller);
  return;
}

function goGetEnergy(creep: Creep, room: Room): void {
  if (creep.memory.carrierTarget == undefined && !getCarrierTarget(creep, room)) {
    let source = Game.getObjectById(creep.memory.source!) as Source;
    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
      creep.myMove(source);
    }
    return;
  }
  
  let target = Game.getObjectById(creep.memory.carrierTarget!.id) as AnyStoreStructure;
  let creepNeed = creep.store.getFreeCapacity(RESOURCE_ENERGY);
  if (target == null || target.store['energy'] < creepNeed) {
    creep.memory.carrierTarget = undefined;
    return;
  }
  let res = creep.withdraw(target, 'energy');
  switch (res) {
    case ERR_NOT_IN_RANGE: creep.myMove(target); break;
    case OK: creep.memory.carrierTarget = undefined; break;
  }
  return;
}

function getCarrierTarget(creep: Creep, room: Room): boolean {
  let creepNeed = creep.store.getFreeCapacity(RESOURCE_ENERGY);
  let containers = room.find(FIND_STRUCTURES).
    filter(i => i.structureType == STRUCTURE_CONTAINER && i.store['energy'] >= creepNeed);
  if (room.controller?.pos.findInRange(containers, 2).length != 0) {
    let container = room.controller?.pos.findInRange(containers, 2)[0] as StructureContainer;
    creep.memory.carrierTarget = {id: container.id, type: 'energy'};
    return true;
  }
  if (room.storage != undefined && room.storage.store['energy'] >= creepNeed) {
    creep.memory.carrierTarget = {id: room.storage.id, type: 'energy'};
    return true;
  }
  if (containers.length > 0) {
    let container = creep.pos.findClosestByRange(containers) as StructureContainer;
    creep.memory.carrierTarget = {id: container.id, type: 'energy'};
    return true;
  }
  creep.memory.carrierTarget = undefined;
  return false;
}