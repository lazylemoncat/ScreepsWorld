export const centerTransferer = {
  /**
   * 执行中央的运输任务
   * @param room 执行的房间
   */
  run: function (room: Room): void {
    // 当房间等级小于4时返回
    if (room.controller!.level < 4) {
      return;
    }
    // 只在第一个 spawn 产中央运输爬
    let spawn = room.find(FIND_MY_SPAWNS)[0];
    // 检查是否需要生成新的运输爬
    this.checkSpawnCreep(spawn, room);
    // 遍历找到所有中央爬
    let centerTransferer = _.filter(room.find(FIND_MY_CREEPS), i =>
        i.memory.role == "centerTransferer");
    // 执行任务
    for (let i = 0; i < centerTransferer.length; ++i) {
      this.runCenterTransferer(centerTransferer[i], room);
    }
    return;
  },
  /**
   * 返回中央运输爬的身体
   * @returns {BodyPartConstant[]} 运输爬的身体
   */
  createTransfererBody: function (): BodyPartConstant[] {
    return [CARRY];
  },
  /**
   * 返回中央运输爬的名字
   * @returns {string} 运输爬的名字
   */
  createTransfererName: function (): string {
    return "centerTransferer" + Game.time
  },
  /**
   * 检查是否需要生产新的中央运输爬
   * @param spawn 执行生产任务的 spawn
   * @param room 执行任务的房间
   */
  checkSpawnCreep: function (spawn: StructureSpawn, room: Room): void {
    let centerTransferer = _.filter(room.find(FIND_MY_CREEPS), i =>
        i.memory.role == "centerTransferer");
    if (centerTransferer.length < 2) {
      let name = this.createTransfererName();
      let body = this.createTransfererBody();
      let memory = { role: 'centerTransferer' };
      let result = spawn.spawnCreep(body, name, {
        memory: memory,
        directions: [TOP_RIGHT, BOTTOM_RIGHT],
      });
      return;
    }
  },
  /**
   * 中央运输爬执行运输任务
   * @param creep 目标中央运输爬
   * @param room 执行任务的房间
   */
  runCenterTransferer: function (creep: Creep, room: Room): void {
    if (creep.store.getFreeCapacity() > 0) {
      let targets = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => 
          "store" in i 
          && i.store[RESOURCE_ENERGY] > 0
          && (i.structureType == STRUCTURE_CONTAINER 
          || i.structureType == STRUCTURE_LINK
          || i.structureType == STRUCTURE_STORAGE
          || i.structureType == STRUCTURE_TERMINAL)
      ) as AnyStoreStructure[];
      creep.withdraw(targets[0], RESOURCE_ENERGY);
    } else {
      let targets = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => 
        "store" in i 
        && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        && (i.structureType == STRUCTURE_EXTENSION
            || i.structureType == STRUCTURE_SPAWN)
      ) as AnyStoreStructure[];
      creep.transfer(targets[0], RESOURCE_ENERGY);
    }
    return;
  },
}