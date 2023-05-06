export const outerSource = {
  /**
   * 执行外矿行为
   * @param room 执行外矿的房间
   */
  run: function (room: Room) {
    // 检查是否需要生成新的采矿或运输 creep
    let spawn = room.find(FIND_MY_SPAWNS)[0];
    this.checkSpawnCreep(spawn, room);
    // 遍历所有的外矿 creep 
    let outerCreeps = _.filter(Game.creeps, i => 
      i.memory.role == 'outerHarvester'
      || i.memory.role == 'outerCarrier'
      || i.memory.role == 'outerClaimer'
    );
    for (let i = 0; i < outerCreeps.length; ++i) {
      // 获取 creep 对象 
      let creep = outerCreeps[i];
      // 根据 creep 的角色执行不同的行为 
      if (creep.memory.role == 'outerHarvester') {
        this.runHarvester(creep);
      } else if (creep.memory.role == 'outerCarrier') {
        this.runCarrier(creep, room);
      } else if (creep.memory.role == 'outerClaimer') {
        this.runOuterClaimer(creep);
      }
    }
    return;
  },
  /**
   * 返回采矿爬的身体 
   * @param room 生产爬的房间
   * @returns {BodyPartConstant[]} 身体部件数组
   */
  createHarvesterBody: function (room: Room): BodyPartConstant[] {
    let energy = room.energyCapacityAvailable;
    let bodys = [WORK, WORK, CARRY, MOVE];
    if (energy >= 800) {
      bodys = [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE];
      return bodys;
    }
    const consume = 300;
    let times = Math.floor((energy - consume) / 250);
    for (let i = 0; i < times; ++i) {
      bodys.push(WORK, WORK, MOVE);
    }
    return bodys;
  },
  /**
   * 返回运输爬的身体 
   * @param room 生产爬的房间
   * @returns {BodyPartConstant[]} 身体部件数组
   */
  createCarrierBody: function (room: Room): BodyPartConstant[] {
    let energy = room.energyCapacityAvailable;
    let bodys = [CARRY, MOVE] as BodyPartConstant[];
    if (energy <= 300) {
      bodys = [CARRY, MOVE];
    }
    const consume = 100;
    let times = Math.floor((energy - consume) / 100);
    for (let i = 0; i < times; ++i) {
      bodys.push(CARRY, MOVE);
    }
    return bodys;
  },
  /**
   * 返回预定者的身体部件数组
   * @returns {BodyPartConstant[]} 身体部件数组
   */
  createOuterClaimerBody: function (): BodyPartConstant[] {
    return [CLAIM, CLAIM, MOVE, MOVE];
  },
  /**
   * 生成采矿爬的名字
   * @param sourceId 目标 source 的ID
   * @returns {string} 采矿爬的名字
   */
  createHarvesteName: function (sourceId: string): string {
    return 'outerHarvester_' + sourceId;
  },
  /**
   * 生成运输爬的名字
   * @param sourceId 目标 source 的ID
   * @param index 目标 source 的第几个运输爬
   * @returns {string} 运输爬的名字
   */
  createCarrierName: function (sourceId: string, index: number): string {
    return 'outerCarrier_' + sourceId + '_' + index;
  },
  /**
   * 返回预定者的名字
   * @param roomName 目标外矿的房间名
   * @returns 预定者的名字
   */
  createOuterClaimerName: function (roomName: string): string {
    return 'outerClaimer' + roomName;
  },
  /**
   * 检查是否需要产 creep，如果是，则生产 creep
   * @param spawn 目标 spawn
   * @param bornRoom 生成 creep 的房间
   */
  checkSpawnCreep: function (spawn: StructureSpawn, bornRoom: Room): void {
    // 找到所有名字中含有 outerSource 的旗子
    let flags = Object.keys(Game.flags).filter(key => 
      key.includes('outerSource'));
    for (let i = 0; i < flags.length; ++i) {
      let flag = Game.flags[flags[i]];
      // 如果没有找到 flag ，则返回
      if (!flag) {
        return;
      }
      // 获取 flag 所在房间的对象
      let room = flag.room;
      // 如果没有找到房间对象，说明没有房间视野，则派出 scout 后返回
      if (!room) {
        this.scout(bornRoom, flags[i]);
        return;
      }
      if (this.delayHarvest(room)) {
        return;
      }
      // 获取 flag 房间内的所有 source 对象
      let sources = Game.rooms[flag.pos.roomName].find(FIND_SOURCES);
      // 遍历每个能量矿
      for (let source of sources) {
        // 获取能量矿的 id
        let sourceId = source.id;
        // 检查是否有足够数量的采矿 creep
        let outerHarvesters = _.filter(Game.creeps, i => 
            i.memory.role == 'outerHarvester' && i.memory.sourceId == sourceId);
        if (outerHarvesters.length < 1) {
          // 如果不够，则尝试生成一个新的采矿 creep
          let name = this.createHarvesteName(sourceId);
          let body = this.createHarvesterBody(bornRoom);
          let memory = {
            role: 'outerHarvester', 
            sourceId: source.id,
            outerRoom: room.name,
          }
          // 生成一个新的采矿 creep
          let result = spawn.spawnCreep(body, name, {
            memory: memory,
            directions: [TOP_LEFT , LEFT, BOTTOM_LEFT],
          });
          // 返回，不再检查其他能量矿
          return;
        }
        // 检查是否有足够数量的运输 creep
        let carriers = _.filter(Game.creeps, i => 
            i.memory.role == 'outerCarrier' && i.memory.sourceId == sourceId);
        if (carriers.length < 1) {
          // 如果不够，则尝试生成一个新的运输 creep
          let index = carriers.length + 1;
          let name = this.createCarrierName(sourceId, index);
          let body = this.createCarrierBody(bornRoom);
          let memory = {
            role: 'outerCarrier', 
            sourceId: sourceId,
            outerRoom: room.name,
          };
          // 生成一个新的运输 creep
          let result = spawn.spawnCreep(body, name, {
            memory: memory,
            directions: [TOP_LEFT , LEFT, BOTTOM_LEFT],
          });
          // 返回，不再检查其他能量矿
          return;
        }
        // 控制器等级小于4没必要出预定者
        if (bornRoom.controller!.level < 4) {
          continue;
        }
        // 检查是否有预定者
        let claimer = _.find(Game.creeps, i => 
          i.memory.role == 'outerClaimer' 
          && i.memory.outerRoom == room!.name
        );
        // 如果没有，则生成一个
        if (claimer == undefined) {
          let name = this.createOuterClaimerName(room.name);
          let body = this.createOuterClaimerBody();
          let memory = {
            role: 'outerClaimer', 
            outerRoom: room.name,
          };
          // 生成一个新的预定者
          let result = spawn.spawnCreep(body, name, {
            memory: memory,
            directions: [TOP_LEFT , LEFT, BOTTOM_LEFT],
          });
          return;
        }
      }
    }
    return;
  },
  /**
   * 执行采矿爬行为
   * @param creep 目标采矿爬对象
   */
  runHarvester: function (creep: Creep): void {
    let sourceId = creep.memory.sourceId!;
    // 根据 id 获取能量矿对象
    let source = Game.getObjectById(sourceId);
    // 如果没有找到能量矿对象，说明没有房间视野，则向该房间移动
    if (!source) {
      creep.moveTo(new RoomPosition(25, 25, creep.memory.outerRoom!))
      return;
    }
    // 尝试采集能量矿
    let result = creep.harvest(source);
    // 如果不在范围内，则向能量矿移动
    if (result == ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    }
    return;
  },
  /**
   * 执行运输爬行为
   * @param creep 目标运输爬对象
   * @param room 将能量带回来的房间，即生产房
   */
  runCarrier: function (creep: Creep, room: Room): void { 
    let sourceId = creep.memory.sourceId!;
    // 根据 id 获取能量矿对象
    let source = Game.getObjectById(sourceId);
    // 如果没有找到能量矿对象，说明没有房间视野，则向 flag 移动
    if (!source) {
      creep.moveTo(new RoomPosition(25, 25, creep.memory.outerRoom!))
      return;
    }
    // 判断 creep 是否在工作模式
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
      // 如果在工作模式且没有能量了，则切换到非工作模式
      creep.memory.working = false;
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
      // 如果在非工作模式且没有容量了，则切换到工作模式
      creep.memory.working = true;
    }
    // 根据工作模式执行不同的行为
    if (creep.memory.working) {
      // 在工作模式下，将能量运输回基地
      // 获取基地的 container 对象
      let container = _.filter(room.find(FIND_STRUCTURES), i =>
        i.structureType == STRUCTURE_CONTAINER
        && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      ) as StructureContainer[];
      // 获取最近的 container 对象
      let target = creep.pos.findClosestByRange(container);
      // 如果没有找到最近的对象，说明并不在基地房间里，则向基地移动
      if (target == null) {
        creep.moveTo(new RoomPosition(25, 25, room.name), {
          reusePath: 20,
          maxOps: 2000,
        });
        return;
      }
      // 尝试将能量转移给 container
      let result = creep.transfer(target, RESOURCE_ENERGY);
      // 如果不在范围内，则向 container 移动
      if (result == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
    } else {
      // 在非工作模式下，从 container 或地上掉落的资源中获取能量
      // 获取能量矿旁边的 container 对象
      let container = source.pos.findInRange(FIND_STRUCTURES, 1, {
          filter: s => s.structureType == STRUCTURE_CONTAINER
      })[0];
      // 获取 source 旁边掉落的资源对象
      let resource = source.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {
        filter: s => s.resourceType == RESOURCE_ENERGY
      })[0];
      // 如果没有找到 container 对象，则向 source 移动
      if (!container && !resource) {
        if (creep.pos.getRangeTo(source) < 3) {
          return;
        }
        creep.moveTo(source);
        return;
      }
      // 尝试从 container 中取出能量
      let result = 0;
      if (container) {
        result = creep.withdraw(container, RESOURCE_ENERGY);
        // 如果不在范围内，则向 container 移动
        if (result == ERR_NOT_IN_RANGE) {
          creep.moveTo(container);
        }
      } else {
        result = creep.pickup(resource);
        // 如果不在范围内，则向 resource 移动
        if (result == ERR_NOT_IN_RANGE) {
          creep.moveTo(resource);
        }
      }
    }
    return;
  },
  /**
   * 执行预定者任务
   * @param creep 预定者对象
   */
  runOuterClaimer: function (creep: Creep): void {
    // 获取控制器对象
    let room = Game.rooms[creep.memory.outerRoom!];
    let controller = room.controller!
    // 如果没有找到控制器对象，说明没有房间视野，则向该房间移动
    if (!controller) {
      creep.moveTo(new RoomPosition(25, 25, creep.memory.outerRoom!), {
        maxOps: 1000,
        reusePath: 20,
      });
      return;
    }
    // 尝试预定控制器,若不够距离则移动至控制器
    if (creep.reserveController(controller) == ERR_NOT_IN_RANGE) {
      creep.moveTo(controller);
      return;
    }
    return;
  },
  /**
   * 执行 scout 行为，使其移动至目标房间获取房间视野
   * @param room 生产 scout 的房间对象
   */
  scout: function (room: Room, flagName: string): void {
    let flag = Game.flags[flagName];
    // 如果找不到旗子,则返回
    if (!flag) {
      return;
    }
    // 找到所有侦察兵
    let scout  = _.find(Game.creeps, i => i.memory.role == "scout");
    // 若 scout 不存在,则新生产一个 scout
    if (scout == undefined) {
      let spawn = room.find(FIND_MY_SPAWNS)[0];
      spawn.spawnCreep([MOVE], "scout", {
        memory: {role: 'scout'},
        directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
      });
      return;
    }
    // 移动到旗子处
    scout.moveTo(flag.pos);
    return;
  },
  delayHarvest: function (room: Room): boolean {
    if (Memory.delayHarvest != undefined 
        && Memory.delayHarvest.room == room.name) {
      return true;
    }
    // 若外矿房间内有敌对 creep, 则延迟采矿
    let enemy = room.find(FIND_HOSTILE_CREEPS)[0];
    if (enemy != undefined) {
      Memory.delayHarvest = {room: room.name, time: 1500};
      return true;
    }
    return false;
  },
}
