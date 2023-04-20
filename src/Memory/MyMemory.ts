export const MyMemory = {
  run: function (): void {
    this.deleteDead();
    return;
  },
  /**
   *  删除 memory 中不存在的creep
   */
  deleteDead: function (): void {
    for (let name in Memory.creeps) {
      if(!Game.creeps[name]) {
        delete Memory.creeps[name];
      }
    }
    return;
  },
  /**
   * 判断creep能量够不够，更新memory中working状态
   * @param creep 
   * @param resource 
   * @returns true | false
   */
  upateWorking: function (creep: Creep, resource: ResourceConstant): boolean {
    if(creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
      creep.memory.working = false;
      return false;
    } else if(!creep.memory.working 
      && creep.store.getFreeCapacity('energy') == 0) {
      creep.memory.working = true;
      return true;
    }
    if (creep.memory.working) {
      return true;
    } else {
      return false;
    }
    return false;
  },
}