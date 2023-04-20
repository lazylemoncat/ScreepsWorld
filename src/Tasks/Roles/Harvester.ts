export const Harvester = {
  run: function (source: Source, room: Room, harvester: Creep): void {
    if (this.transferExtension(harvester, room)) {
      return;
    }
    this.harvestEnergy(harvester, source, room);
    return;
  },
  harvestEnergy: function (creep: Creep, target: Source, room: Room): void {
    if (creep.store.getFreeCapacity() < creep.getActiveBodyparts(WORK) * 2) {
      this.transferEnergy(creep, room);
      return;
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
    let containers = _.filter(room.find(FIND_STRUCTURES), (i) => 
      i.structureType == "container" 
      && creep.pos.getRangeTo(i) <= 1) as StructureContainer[];
    // TODO 添加传入link
    if (containers[0] != undefined) {
      creep.transfer(containers[0], "energy");
      return;
    }
    let container = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i =>
      i.structureType == "container")[0];
    if (container != undefined) {
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
    if (containers[0] == undefined) {
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
    return false;
  }
}