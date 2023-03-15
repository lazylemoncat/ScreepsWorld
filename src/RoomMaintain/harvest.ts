import { build } from "./build";

export const harvest = {
  run: function(room: Room): void {
    for (let i = 0; i < room.memory.harvesters.length; i++) {
      let harvester = Game.creeps[room.memory.harvesters[i]];
      if (harvester == null) {
        Memory.creepsNum--;
        continue;
      }
      let transfered: boolean = true;
      if (harvester.store.getFreeCapacity() < harvester.getActiveBodyparts(WORK) * 2) {
        transfered = this.transferEnergy(harvester, room);
      }
      this.goHarvest(harvester, transfered, room);
    }
    return;
  },

  goHarvest: function(creep: Creep, transfered: boolean, room: Room): void {
    if (!transfered) {
      return;
    }
    let source = Game.getObjectById(creep.memory.source!) as Source;
    if (!this.harvestSource(room,creep)) {
      return;
    }
    if (creep.memory.container == undefined) {
      let container = source.pos.findInRange(FIND_STRUCTURES, 1).filter(i => i.structureType == STRUCTURE_CONTAINER)[0];
      if (container != null) {
        creep.memory.container = (container as StructureContainer).id;
      }
    } else {
      let container = Game.getObjectById(creep.memory.container);
      if (container != null) {
        if (!creep.pos.isEqualTo(container)) {
          creep.myMove(container);
        }
      }
      if (container == null) {
        creep.memory.container = undefined;
      }
    }
    return;
  },

  harvestSource: function(room: Room, creep: Creep): boolean {
    if (creep.store.getFreeCapacity('energy') == 0) {
      return true;
    }
    if (creep.memory.source == undefined) {
      creep.memory.source = room.find(FIND_SOURCES)[0].id;
    }
    let source = Game.getObjectById(creep.memory.source!) as Source;
    if (source.energy == 0) {
      source = room.find(FIND_SOURCES).filter(i => i.energy > 0)[0];
    }

    if (!creep.pos.isNearTo(source)) {
      creep.myMove(source);
      return false;
    }
    creep.harvest(source);
    return true;
  },
  transferEnergy: function (creep: Creep, room: Room): boolean {
    let source = Game.getObjectById(creep.memory.source!) as Source;
    if (creep.memory.link == undefined) {
      let link = room.find(FIND_STRUCTURES).filter(i => i.pos.isNearTo(source) && 
        i.structureType == STRUCTURE_LINK)[0] as StructureLink;
      if (link != undefined) {
        creep.memory.link = link.id;
      }
    }
    if (creep.memory.link != undefined) {
      let link = Game.getObjectById(creep.memory.link) as StructureLink;
      let res = creep.transfer(link, 'energy');
      if (res == OK) {
        return true;
      }
      return false;
    }
  
    if (creep.memory.container != undefined) {
      let container = Game.getObjectById(creep.memory.container) as StructureContainer;
      let res = creep.transfer(container, 'energy');
      if (res == OK) {
        return true;
      }
      return false;
    }
    
    let spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn.store.getFreeCapacity('energy') < creep.store['energy']) {
      if (build.build(creep, room)) {
        return false;
      }
    }
    if (creep.transfer(spawn, 'energy') == ERR_NOT_IN_RANGE) {
      creep.myMove(spawn);
    }
    return false;
  }
}

