export const Tasks = {
  getEnergyTransferTasks: function (room: Room) {
    global.tasks = [];
    let storeTarget = _.filter(room.find(FIND_STRUCTURES), i => 
      "store" in i 
      && i.store["energy"] < i.store.getCapacity("energy")
      && (
        i.structureType == "spawn" || (i.structureType == "extension" 
        && i.pos.findInRange(FIND_SOURCES, 2).length == 0)
        || i.structureType == "tower"
        || (i.structureType == "terminal" && i.store["energy"] < 50000)
        || i.structureType == "lab"
      )
      && global.tasks.find(target => (target.target == i.id)
      && target.type == "transfer" && target.resource == "energy")
    ) as AnyStoreStructure[];
    return;
  }
}