export const sites = {
  run: function(room: Room): void {
    if (room.memory.sites.init == room.controller?.level) {
      return;
    }
    switch (room.memory.sites.init + 1) {
      case 1: {
        if (this.sourceContainer(room) == true) {
          room.memory.sites.init = 1;
        }
        break;
      }
    }
  },

  sourceContainer: function(room: Room) : boolean {
    let sources = room.find(FIND_SOURCES);
    let containersNum = sources.length;
    let controller = room.controller as StructureController;
    let containers = room.find(FIND_STRUCTURES).filter(i => i.structureType == STRUCTURE_CONTAINER);
    let spawnPos = room.find(FIND_STRUCTURES).filter(i => i.structureType == STRUCTURE_SPAWN)[0].pos;
    if (containers.length >= containersNum) {
      let path = room.findPath(spawnPos, controller.pos, {ignoreCreeps: true, ignoreRoads: true, swampCost: 1});
      let pos = new RoomPosition(path[path.length - 3].x, path[path.length - 3].y, room.name);
      pos.createConstructionSite(STRUCTURE_CONTAINER);
      return true;
    }
    if (containers.length < containersNum) {
      for (let i = 0; i < sources.length; i++) {
        let container = sources[i].pos.findInRange(containers, 1)[0];
        let site = sources[i].pos.findInRange(FIND_CONSTRUCTION_SITES, 1).find(i => 
          i.structureType == STRUCTURE_CONTAINER);
        if (container != undefined || site != undefined) {
          continue;
        }
        let path = room.findPath(spawnPos, sources[i].pos, {ignoreCreeps: true, ignoreRoads: true, swampCost: 1});
        let pos = new RoomPosition(path[path.length - 2].x, path[path.length - 2].y, room.name);
        pos.createConstructionSite(STRUCTURE_CONTAINER);
      }
    }
    return false;
  },
}