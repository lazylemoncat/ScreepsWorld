export const build = {
  run: function(room: Room): void {
    for (let i = 0; i < room.memory.builders.length; i++) {
      let builder = Game.creeps[room.memory.builders[i]];
      if (builder == null) {
        Memory.creepsNum--;
        continue;
      }
      if(builder.memory.working && builder.store[RESOURCE_ENERGY] == 0) {
        builder.memory.working = false;
      } else if(!builder.memory.working && builder.store.getFreeCapacity('energy') == 0) {
        builder.memory.working = true;
      }

      if(builder.memory.working) {
        this.build(builder, room);
      } else {
        goGetEnergy(builder, room);
      }
    }
    return;
  },

  build: function(creep: Creep, room: Room): boolean {
    if (creep.memory.buildTarget == undefined || Game.getObjectById(creep.memory.buildTarget) == null) {
      let site = room.find(FIND_CONSTRUCTION_SITES)[0];
      if (site != undefined) {
        creep.memory.buildTarget = site.id;
      }
    }
    if (creep.memory.buildTarget == undefined) {
      return false;
    }
    let site = Game.getObjectById(creep.memory.buildTarget);
    if(site) {
      if(creep.build(site) == ERR_NOT_IN_RANGE) {
        creep.myMove(site);
      }
    }
    return true;
  },
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