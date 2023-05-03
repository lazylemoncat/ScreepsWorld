export const Harvester = {
  run: function (source: Source, room: Room, harvester: Creep): void {
    if (this.transferExtension(harvester, room)) {
      return;
    } else {
      this.harvestEnergy(harvester, source, room);
    }
    
    return;
  },
  harvestEnergy: function (creep: Creep, target: Source, room: Room): void {
    let resouces = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1).filter(
      i => i.resourceType == "energy"
    );
    let tombstones = creep.pos.findInRange(FIND_TOMBSTONES, 1).filter(i => 
      i.store["energy"] > 0);
    if (resouces.length != 0) {
      creep.pickup(resouces[0]);
    } else {
      if (tombstones.length != 0) {
        creep.withdraw(tombstones[0], "energy");
      }
    }
    if (creep.store.getFreeCapacity() < creep.getActiveBodyparts(WORK) * 4) {
      this.transferEnergy(creep, room);
      if (creep.store.getFreeCapacity() < creep.getActiveBodyparts(WORK) 
        * 2) {
        this.transferEnergy(creep, room);
        return;
      }
    }
    if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
    }
    return;
  },
  transferEnergy: function (creep: Creep, room: Room): void {
    let energy = creep.store["energy"];
    if (energy == 0) {
      return;
    }
    let sites = room.find(FIND_CONSTRUCTION_SITES);
    let site = creep.pos.findInRange(sites, 1)[0];
    if (site != undefined) {
      creep.build(site);
      return;
    }
    let extensions = _.filter(room.find(FIND_STRUCTURES), (i) => 
      i.structureType == "extension"
      && i.store.getFreeCapacity("energy") > 0
      && creep.pos.getRangeTo(i) == 1) as StructureExtension[];
    if (extensions[0] != undefined) {
      creep.transfer(extensions[0], "energy");
      return;
    }
    let link = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i =>
      i.structureType == "link")[0];
    if (link != undefined) {
      creep.transfer(link, "energy");
      return;
    }
    let containers = _.filter(room.find(FIND_STRUCTURES), (i) => 
      i.structureType == "container" 
      && i.store.getFreeCapacity() > 0
      && creep.pos.getRangeTo(i) <= 1
      && i.pos.findInRange(FIND_MINERALS, 1).length == 0
    ) as StructureContainer[];
    if (containers[0] != undefined) {
      creep.transfer(containers[0], "energy");
      return;
    }
    let container = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i =>
      i.structureType == "container")[0];
    if (container != undefined || link != undefined) {
      return;
    }
    let spawn = room.find(FIND_MY_SPAWNS)[0];
    if (creep.transfer(spawn, "energy") == ERR_NOT_IN_RANGE) {
        creep.moveTo(spawn);
    }
    return;
  },
  transferExtension: function (creep: Creep, room: Room): boolean {
    if (creep.store["energy"] == creep.store.getCapacity()) {
      return false;
    }
    let containers = _.filter(room.find(FIND_STRUCTURES), (i) => 
      i.structureType == "container" 
      && creep.pos.getRangeTo(i) <= 1) as StructureContainer[];
    if (containers[0] == undefined || containers[0].store["energy"] == 0) {
      return false;
    }
    let extensions = _.filter(room.find(FIND_STRUCTURES), (i) => 
      i.structureType == "extension"
      && i.store.getFreeCapacity("energy") > 0
      && creep.pos.getRangeTo(i) == 1) as StructureExtension[];
    if (extensions[0] != undefined) {
      creep.withdraw(containers[0], "energy");
      return true;
    }
    let links = _.filter(room.find(FIND_STRUCTURES), (i) => 
      i.structureType == "link"
      && i.store.getFreeCapacity("energy") > 0
      && creep.pos.getRangeTo(i) == 1) as StructureLink[];
    if (links[0] != undefined) {
      creep.withdraw(containers[0], "energy");
      return true;
    }
    return false;
  }
}