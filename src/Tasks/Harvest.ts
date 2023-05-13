import { returnFreeSpawn } from "@/structures/spawns";

export const harvest = {
  /**
   * 执行采集任务
   * @param room 执行采集任务的房间
   */
  run: function (room: Room): void {
    this.checkSpawnCreep(room);
    let creeps = _.filter(room.find(FIND_MY_CREEPS), (creep) => 
      creep.memory.role == "harvester"
      || creep.memory.role == 'mineraler'
    );
    for (let i = 0; i < creeps.length; ++i) {
      switch (creeps[i].memory.role) {
        case 'harvester': this.runHarvester(creeps[i]); break;
        case 'mineraler': this.runMineraler(creeps[i], room); break;
      }
    }
    return;
  },
  calSourcePath: function(room: Room): number {
    let sources = room.find(FIND_SOURCES);
    if (sources.length < 2) {
      return 0;
    }
    let res = room.findPath(sources[0].pos, sources[1].pos, {
      ignoreCreeps: true,
    });
    return res.length;
  },
  /**
   * 返回 harvester 的名字
   * @param room 生产 harvester 的房间
   * @param sourceId 目标能量矿的 ID
   * @returns {string} harvester 的名字
   */
  createHarvesterName: function (room: Room): string {
    return 'harvester' + room.name + '_' + Game.time % 10;
  },
  createMineralName: function(room: Room): string {
    return 'mineraler' + room.name + '_' + Game.time % 10;
  },
  /**
   * 返回 harvester 的身体部件数组
   * @param room 生产 harvester 的房间
   * @returns {BodyPartConstant[]} harvester 的身体部件数组
   */
  createHarvesterBody: function (room: Room): BodyPartConstant[] {
    let energy = room.energyAvailable;
    let bodys: BodyPartConstant[] = [CARRY, MOVE];
    let consume = 100;
    if (room.controller!.level >= 5) {
      bodys.push(CARRY);
      consume += 50;
    }
    let times = Math.floor((energy - consume) / 250);
    for (let i = 0; i < times; ++i) {
      bodys.push(WORK, WORK, MOVE);
    }
    return bodys;
  },
  createMineralBody: function(room: Room): BodyPartConstant[] {
    let energy = room.energyAvailable;
    let bodys: BodyPartConstant[] = [];
    let times = Math.floor(energy / 250);
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
  newMineral: function(room: Room): void {
    let spawn = returnFreeSpawn(room);
    if (spawn == undefined) {
      return;
    }
    let mineral = room.find(FIND_MINERALS)[0];
    let name = this.createMineralName(room);
    let body = this.createMineralBody(room);
    let memory: CreepMemory = {
      role: 'mineraler',
      bornRoom: room.name,
    };
    spawn.spawnCreep(body, name, {
      memory,
      directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
    });
    return;
  },
  checkSpawnCreep: function(room: Room): void {
    let sources = room.find(FIND_SOURCES);
    let harvesters = _.filter(room.find(FIND_MY_CREEPS), i => 
      i.memory.role == 'harvester');
    if (harvesters.length < sources.length) {
      for (let i = 0; i < sources.length; ++i) {
        let id = sources[i].id;
        if (!harvesters.find(creep => creep.memory.source!.id == id)) {
          if (sources[i].energy != 0) {
            this.newHarvester(room, id);
            break;
          }
        }
      }
    }
    let extractor = _.find(room.find(FIND_STRUCTURES), i =>
      i.structureType == STRUCTURE_EXTRACTOR
    );
    if (room.controller!.level < 6 || !extractor) {
      return;
    }
    let mineraler = _.find(room.find(FIND_MY_CREEPS), i => 
      i.memory.role == 'mineraler');
    let mineral = room.find(FIND_MINERALS)[0];
    if (mineraler == undefined && mineral.mineralAmount != 0) {
      this.newMineral(room);
    }
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
    if (creep.store[RESOURCE_ENERGY] < 50) {
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
    if (creep.store.getFreeCapacity() > creep.getActiveBodyparts(WORK) * 2) {
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
  runMineraler: function(creep: Creep, room: Room) {
    let mineral = room.find(FIND_MINERALS)[0];
    let container = _.find(room.find(FIND_STRUCTURES), i => 
      i.structureType == STRUCTURE_CONTAINER
      && i.pos.getRangeTo(mineral) == 1
    ) as StructureContainer;
    if (container == undefined) {
      creep.moveTo(mineral);
      return;
    }
    if (!creep.pos.isEqualTo(container)) {
      creep.moveTo(container);
      return;
    }
    if (container.store.getFreeCapacity() 
      >= creep.getActiveBodyparts(WORK)) {
      creep.harvest(mineral);
    }
    return;
  },
}