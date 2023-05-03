export const MyMemory = {
  run: function (): void {
    this.reset();
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
    let resouceType = Object.keys(creep.store)[0]as ResourceConstant;
    if (resouceType == undefined) {
      resouceType = "energy";
    }
    if(creep.memory.working && creep.store[resouceType] == 0) {
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
  },
  reset: function(): void {
    if (Memory.bornRoom in Game.rooms) {
      return;
    }
    Memory.bornRoom = Game.spawns["Spawn1"].room.name;
  },
}