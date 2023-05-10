import { returnFreeSpawn, spawns } from "@/structures/spawns";

export const harvest = {
  /**
   * 执行采集任务
   * @param room 执行采集任务的房间
   */
  run: function (room: Room): void {
    let sources = room.find(FIND_SOURCES);
    let harvesters = _.filter(room.find(FIND_MY_CREEPS), (creep) => 
      creep.memory.role == "harvester");
    if (harvesters.length < sources.length) {
      for (let i = 0; i < sources.length; ++i) {
        let id = sources[i].id;
        if (!harvesters.find(creep => creep.memory.source!.id == id)) {
          this.newHarvester(room, id);
          break;
        }
      }
    }
    for (let i = 0; i < harvesters.length; ++i) {
      this.runHarvester(harvesters[i]);
    }
    return;
  },
  /**
   * 返回 harvester 的名字
   * @param room 生产 harvester 的房间
   * @param sourceId 目标能量矿的 ID
   * @returns {string} harvester 的名字
   */
  createHarvesterName: function (room: Room): string {
    return 'harvester' + room.name + '_' +Game.time % 10;
  },
  /**
   * 返回 harvester 的身体部件数组
   * @param room 生产 harvester 的房间
   * @returns {BodyPartConstant[]} harvester 的身体部件数组
   */
  createHarvesterBody: function (room: Room): BodyPartConstant[] {
    let energy = room.energyAvailable;
    let bodys = [WORK, WORK, CARRY, MOVE];
    const consume = 300;
    let times = Math.floor((energy - consume) / 250);
    if (times >= 3) times = 3;
    for (let i = 0; i < times; ++i) {
      bodys.push(WORK, WORK, MOVE);
    }
    return bodys;
  },
  /**
   * 生产一个新的 harvester
   * @param room 执行采集任务的房间对象
   * @param sourceId 目标能量矿的 ID
   */
  newHarvester: function (room: Room, sourceId: string): void {
    let spawn = returnFreeSpawn(room);
    if (spawn == undefined) {
      return;
    }
    let source = Game.getObjectById(sourceId as Id<Source>);
    let result = spawn.spawnCreep(
      this.createHarvesterBody(room),
      this.createHarvesterName(room),
      { memory: { 
          role: 'harvester', 
          bornRoom: room.name,
          source: {id: sourceId as Id<Source>, pos: source!.pos},
        },
        directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
      },
    );
    return;
  },
  /**
   * harvester 执行采集任务
   * @param creep harvester 对象
   * @param room 执行采集任务的房间
   */
  runHarvester: function (creep: Creep): void {
    let source = Game.getObjectById(creep.memory.source!.id);
    if (source == undefined) {
      return;
    }
    if (creep.pos.getRangeTo(source) != 1) {
      creep.moveTo(source, { maxOps: 100, });
      return;
    }
    if (this.transferExtension(creep)) {
      return;
    } else if (this.transferOut(creep)) {
      creep.harvest(source);
      return;
    }
    if (creep.store.getFreeCapacity() >= creep.getActiveBodyparts(WORK) * 2) {
      creep.harvest(source);
    }
    return;
  },
  /**
   * 对身边一格范围内的 extension 运输能量
   * @param creep harvester 对象
   * @returns {boolean} 是否成功执行运输任务
   */
  transferExtension: function (creep: Creep): boolean {
    let extensions = _.filter(creep.pos.findInRange(FIND_STRUCTURES, 1), i => 
      i.structureType == STRUCTURE_EXTENSION
      && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    ) as StructureExtension[];
    if (extensions.length == 0) {
      return false;
    }
    if (creep.store[RESOURCE_ENERGY] < creep.store.getCapacity()) {
      return this.withdrawEnergy(creep) ? true: false;
    }
    creep.transfer(extensions[0], RESOURCE_ENERGY);
    return true;
  },
  /**
   * harvester 从容器获取能量
   * @param creep harvseter 对象
   * @returns {boolean} 是否成功获取能量
   */
  withdrawEnergy: function (creep: Creep): boolean {
    let container = _.find(creep.pos.findInRange(FIND_STRUCTURES, 1), i => 
      i.structureType == STRUCTURE_CONTAINER
      && i.store[RESOURCE_ENERGY] >= 50
    ) as StructureContainer;
    if (container != undefined) {
      creep.withdraw(container, RESOURCE_ENERGY);
      return true;
    }
    let link = _.find(creep.pos.findInRange(FIND_STRUCTURES, 1), i => 
      i.structureType == STRUCTURE_LINK
      && i.store[RESOURCE_ENERGY] >= 50
    ) as StructureLink;
    if (link != undefined) {
      creep.withdraw(link, RESOURCE_ENERGY);
      return true;
    }
    return false;
  },
  /**
   * 将 harvester 储存的能量运输至容器中
   * @param creep harvester 对象
   * @returns {boolean} 是否成功执行运输任务
   */
  transferOut: function (creep: Creep): boolean {
    if (creep.store.getFreeCapacity() >= creep.getActiveBodyparts(WORK) * 4) {
      return false;
    }
    let link = _.find(creep.pos.findInRange(FIND_STRUCTURES, 1), i => 
      i.structureType == STRUCTURE_LINK
    ) as StructureLink;
    if (link != undefined) {
      let result = creep.transfer(link, RESOURCE_ENERGY);
      return result == 0 ? true : false;
    }
    let container = _.find(creep.pos.findInRange(FIND_STRUCTURES, 1), i => 
      i.structureType == STRUCTURE_CONTAINER
    ) as StructureContainer;
    if (container != undefined) {
      let result = creep.transfer(container, RESOURCE_ENERGY);
      return result == 0 ? true : false;
    }
    return false;
  },
}