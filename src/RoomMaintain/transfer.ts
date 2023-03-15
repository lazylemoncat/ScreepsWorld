export const transfer = {
  run: function(room: Room): void {
    for (let i = 0; i < room.memory.transferers.length; i++) {
      let transfer = Game.creeps[room.memory.transferers[i]];
      if (transfer == null) {
        Memory.creepsNum--;
        continue;
      }
      if(transfer.memory.working && transfer.store[RESOURCE_ENERGY] == 0) {
        transfer.memory.working = false;
      } else if(!transfer.memory.working && transfer.store.getFreeCapacity() == 0) {
        transfer.memory.working = true;
      }

      if(transfer.memory.working) {
        goTransfer(transfer, room);
      } else {
        goWithdraw(transfer, room);
      }
    }
    return;
  },
}

function goTransfer(creep: Creep, room: Room): void {
  let target: AnyStoreStructure|null = null;
  let carrierTarget = creep.memory.carrierTarget;
  if (carrierTarget != undefined) {
    target = Game.getObjectById(carrierTarget.id);
  }
  if (carrierTarget == undefined || target == null || target.store.getFreeCapacity(carrierTarget.type) == 0) {
    target = transferTarget(creep, room);
    if (target == undefined) {
      carrierTarget = undefined;
      return;
    }
    creep.memory.carrierTarget = {id: target.id, type: 'energy'};
  }
  if (target == null) {
    return;
  }

  let res = creep.transfer(target, 'energy');
  switch (res) {
    case ERR_NOT_IN_RANGE: creep.myMove(target); break;
    case OK: creep.memory.carrierTarget = undefined;
  }
  return;
}

function goWithdraw(creep: Creep, room: Room): void {
  let target: AnyStoreStructure|null = null;
  let carrierTarget = creep.memory.carrierTarget;
  if (carrierTarget != undefined) {
    target = Game.getObjectById(carrierTarget.id);
  }
  if (carrierTarget == undefined || target == null || target.store[carrierTarget.type] == 0) {
    target = withdrawTarget(creep, room);
    if (target == undefined) {
      carrierTarget = undefined;
      return;
    }
    creep.memory.carrierTarget = {id: target.id, type: 'energy'};
  }
  if (target == null) {
    return;
  }
  let res = creep.withdraw(target, 'energy');
  switch (res) {
    case ERR_NOT_IN_RANGE: creep.myMove(target); break;
    case OK: creep.memory.carrierTarget = undefined;
  }
  return;
}

function withdrawTarget(creep: Creep, room: Room): AnyStoreStructure | null {
  let creepNeed = creep.store.getFreeCapacity('energy');
  let structures = room.find(FIND_STRUCTURES);
  let links = structures.filter(i => i.structureType == STRUCTURE_LINK);
  if (links.length != 0 && room.storage != undefined) {
    let link = links.find(i => i.pos.isNearTo(room.storage as StructureStorage));
    if (link != undefined && (link as StructureLink).store['energy'] >= 100) {
      return (link as StructureLink);
    }
  }
  let containers = structures.filter(i => i.structureType == STRUCTURE_CONTAINER &&
    i.pos.findInRange(FIND_SOURCES, 1).length != 0 && i.store['energy'] >= 50) as StructureContainer[];
  if (containers.length != 0) {
    return containers[0];
  }
  let storage = room.storage;
  if (storage != undefined && storage.store['energy'] >= creepNeed) {
    return storage;
  }
  return null;
}

function transferTarget(creep: Creep, room: Room): AnyStoreStructure | null {
  let structures = room.find(FIND_STRUCTURES);
  let extensions = structures.filter(i => i.structureType == STRUCTURE_EXTENSION &&
    i.store.getFreeCapacity('energy') > 0);
  if (extensions.length > 0) {
    let extension = creep.pos.findClosestByRange(extensions) as StructureExtension;
    return extension;
  }
  let spawns = structures.filter(i => i.structureType == STRUCTURE_SPAWN && 
    i.store.getFreeCapacity('energy') > 0);
  if (spawns.length > 0) {
    return (spawns[0] as StructureSpawn);
  }
  let containers = structures.filter(i => i.structureType == STRUCTURE_CONTAINER &&
    i.pos.findInRange(FIND_SOURCES, 1).length == 0 &&
    i.pos.findInRange(FIND_MINERALS, 1).length == 0 &&
    i.store.getFreeCapacity('energy') > 0);
  if (containers.length > 0) {
    return containers[0] as StructureContainer;
  }
  if (room.storage != undefined) {
    return room.storage;
  }
  return null;
}