export const Withdraw = {
  /**
   * 从容器中拿取energy
   * @param creep 
   * @param room 
   */
  energy: function(creep: Creep, room : Room): boolean {
    let energy = creep.store.getFreeCapacity();
    if (energy == 0) {
      return true;
    }
    let targets = _.filter(room.find(FIND_STRUCTURES), i => 
      "store" in i 
      && i.store["energy"] >= energy) as AnyStoreStructure[];
    let target = creep.pos.findClosestByRange(targets);
    if (target == undefined) {
      return false;
    }
    if (creep.withdraw(target, "energy") == ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
      return false;
    }
    return true;
  }
}