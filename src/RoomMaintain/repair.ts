import { tower } from "@/Structure/tower";

export const repair = {
  run: function(room: Room): void {
    if (Game.time % 100 == 0) {
      let towers = room.find(FIND_STRUCTURES).filter(i => i.structureType == STRUCTURE_TOWER) as StructureTower[];
      room.memory.towers = towers.map(i => i.id);
    }
    tower.repair(room);
    for (let i = 0; i < room.memory.repairers.length; i++) {
      let repairer = Game.creeps[room.memory.repairers[i]];
      if (repairer == null) {
        Memory.creepsNum--;
        continue;
      }
      if(repairer.memory.working && repairer.store[RESOURCE_ENERGY] == 0) {
        repairer.memory.working = false;
      } else if(!repairer.memory.working && repairer.store.getFreeCapacity() == 0) {
        repairer.memory.working = true;
      }

      if(repairer.memory.working) {
        goRepair(repairer, room);
      } else {
        goGetEnergy(repairer, room);
      }
    }
    return;
  }
}

function goRepair(creep: Creep, room: Room): void {
  let structures = room.find(FIND_STRUCTURES);
  let targets = structures.filter(i => i.hits < i.hitsMax);
  targets.sort((a,b) => a.hits - b.hits);
  if (room.memory.towers.length == 0) {
    targets = targets.filter(i => i.structureType != STRUCTURE_WALL && i.structureType != STRUCTURE_RAMPART);
  } else {
    targets = targets.filter(i => i.structureType == STRUCTURE_WALL || i.structureType == STRUCTURE_RAMPART);
  }
  if (targets[0] != undefined) {
    let target = creep.pos.findClosestByRange(targets) as AnyStructure;
    if (creep.repair(target) == ERR_NOT_IN_RANGE) {
      creep.myMove(target);
    }
  }
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
  if (room.storage != undefined && room.storage.store['energy'] >= creepNeed) {
    creep.memory.carrierTarget = {id: room.storage.id, type: 'energy'};
    return true;
  }
  let containers = room.find(FIND_STRUCTURES).
    filter(i => i.structureType == STRUCTURE_CONTAINER && i.store['energy'] >= creepNeed);
  if (containers.length > 0) {
    let container = creep.pos.findClosestByRange(containers) as StructureContainer;
    creep.memory.carrierTarget = {id: container.id, type: 'energy'};
    return true;
  }
  creep.memory.carrierTarget = undefined;
  return false;
}