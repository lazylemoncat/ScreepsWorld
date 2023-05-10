import { spawns } from "@/structures/spawns";

export const centerTransfer = {
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
    let link = _.find(room.find(FIND_STRUCTURES), i => 
      i.structureType == STRUCTURE_LINK
      && i.pos.getRangeTo(spawn) == 1
    ) as StructureLink;
    if (link == undefined) {
      return;
    }
    this.runCenterLink(link, room);
    return;
  },
  /**
   * 返回中央运输爬的身体
   * @returns {BodyPartConstant[]} 运输爬的身体
   */
  createTransfererBody: function (room: Room): BodyPartConstant[] {
    let carryNum = room.controller!.level - 3;
    let bodys: BodyPartConstant[] = [];
    for (let i = 0; i < carryNum; ++i) {
      bodys.push(CARRY);
    }
    return bodys;
  },
  /**
   * 返回中央运输爬的名字
   * @returns {string} 运输爬的名字
   */
  createTransfererName: function (room: Room): string {
    return "centerTransferer" + room.name + '_' + Game.time % 10
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
      if (!spawns.isFreeFirstSpawn(room, 'centerTransferer')) {
        return;
      }
      let name = this.createTransfererName(room);
      let body = this.createTransfererBody(room);
      let memory = { 
        role: 'centerTransferer',
        bornRoom: room.name,
      };
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
    if (creep.store[RESOURCE_ENERGY] == 0) {
      let targets = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => 
          "store" in i 
          && i.store[RESOURCE_ENERGY] > 0
          && (i.structureType == STRUCTURE_CONTAINER 
          || i.structureType == STRUCTURE_STORAGE
          || i.structureType == STRUCTURE_TERMINAL)
      ) as AnyStoreStructure[];
      creep.withdraw(targets[0], RESOURCE_ENERGY);
    } else {
      let targets = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => 
        "store" in i 
        && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        && (i.structureType == STRUCTURE_EXTENSION
            || i.structureType == STRUCTURE_SPAWN
            )
      ) as AnyStoreStructure[];
      creep.transfer(targets[0], RESOURCE_ENERGY);
    }
    return;
  },
  /**
   * 将中央 Link 的能量传送至升级 Link
   * @param link 中央运输 Link
   * @param room 执行运输任务的房间
   */
  runCenterLink: function (link: StructureLink, room: Room) : void {
    if (link.store[RESOURCE_ENERGY] < 400) {
      return;
    }
    let upgradeLink = _.find(room.find(FIND_STRUCTURES), i => 
      i.structureType == STRUCTURE_LINK
      && i.pos.getRangeTo(room.controller!) <= 3
    ) as StructureLink;
    if (upgradeLink == undefined) {
      return;
    }
    if (upgradeLink.store[RESOURCE_ENERGY] <= 400) {
      link.transferEnergy(upgradeLink);
    }
    return;
  },
}