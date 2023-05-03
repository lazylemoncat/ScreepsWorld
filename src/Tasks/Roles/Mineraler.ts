export const Mineraler = {
  run: function (creep: Creep, room: Room) {
    let mineral = room.find(FIND_MINERALS)[0];
    let container = mineral.pos.findInRange(room.find(FIND_STRUCTURES),
      1).filter(i => i.structureType == "container")[0];
    if (creep.harvest(mineral) == ERR_NOT_IN_RANGE) {
      creep.moveTo(container);
    }
    if (creep.store.getCapacity() - creep.store.getUsedCapacity()
      < creep.getActiveBodyparts(WORK)) {
      let resource = Object.keys(creep.store)[0] as ResourceConstant;
      let container = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i =>
        i.structureType == "container")[0] as StructureContainer;
      if (container != undefined) {
        creep.transfer(container, resource);
        return;
      } else if (room.storage != undefined) {
        if (creep.transfer(room.storage, resource) == ERR_NOT_IN_RANGE) {
          creep.moveTo(room.storage);
        }
        return;
      }
    }
    return;
  },
}