export const Withdraw = {
  /**
   * 从容器中拿取energy
   * @param creep 
   * @param room 
   */
  energy: function(creep: Creep, room : Room) {
    let amount = creep.store.getFreeCapacity();
    let containers = _.filter(room.find(FIND_STRUCTURES), (i) =>
      i.structureType == "container"
      && i.store["energy"] >= amount) as 
      StructureContainer[];
    let links = _.filter(room.find(FIND_STRUCTURES), (i) =>
      i.structureType == "link"
      && i.store.energy >= amount
      && i.pos.findInRange(FIND_SOURCES, 2).length == 0
      && i.pos.getRangeTo(room.find(FIND_MY_SPAWNS)[0]) != 1
      ) as StructureLink[];
    let storage = room.storage;

    let targets: (StructureContainer 
      | StructureStorage | StructureLink)[] = [...containers,...links];
    if (storage != undefined) {
      if (storage.store["energy"] >= amount) {
        targets.push(storage);
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