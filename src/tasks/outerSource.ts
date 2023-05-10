interface outerSourceContext {
  /**
   * 生产 creep 以及返回资源的房间对象
   */
  room: Room,
  /**
   * 获取房间内空闲的 spawn 对象
   * @param room 生产 creep 的房间对象
   * @returns {StructureSpawn | undefined} 返回空闲的 spawn 对象
   */
  returnFreeSpawn: (room: Room) => StructureSpawn | undefined,
};
export const outerSource = function(context: outerSourceContext) {
  /**
   * 执行外矿行为
   */
  const run = function () {
    // 检查是否需要生成新的采矿或运输 creep
    checkSpawnCreep(context.room);
    // 遍历所有的外矿 creep 
    let outerCreeps = _.filter(Game.creeps, i => 
      i.memory.role == 'outerHarvester'
      || i.memory.role == 'outerCarrier'
      || i.memory.role == 'outerClaimer'
      || i.memory.role == 'outerDefender'
      || i.memory.role == 'outerBuilder'
    );
    for (let i = 0; i < outerCreeps.length; ++i) {
      // 获取 creep 对象 
      let creep = outerCreeps[i];
      // 根据 creep 的角色执行不同的行为 
      switch (creep.memory.role) {
        // 0.22cpu
        case 'outerHarvester': runHarvester(creep); break;
        // 0.23cpu
        case 'outerCarrier': runCarrier(creep, context.room); break;
        // 0.23cpu
        case 'outerClaimer': runOuterClaimer(creep); break;
        // 0.3cpu
        case 'outerDefender': runOuterDefender(creep); break;
        case 'outerBuilder': runOuterBuilder(creep); break;
      }
    }
    return;
  };
  /**
   * 返回守护者的身体部件数组
   * @param room 生产守护者的房间
   * @returns {BodyPartConstant[]} 守护者的身体部件数组
   */
  const createOuterDefenderBody = function (room: Room): BodyPartConstant[] {
    let energy = room.energyCapacityAvailable;
    let bodysNum = Math.floor(energy / 130);
    bodysNum = bodysNum > 10 ? 10 : bodysNum;
    let bodys: BodyPartConstant[] = [];
    for (let i = 0; i < bodysNum; ++i) {
      bodys.push(MOVE);
    }
    for (let i = 0; i < bodysNum; ++i) {
      bodys.push(ATTACK);
    }
    return bodys;
  };
  /**
   * 返回采矿爬的身体 
   * @param room 生产爬的房间
   * @returns {BodyPartConstant[]} 身体部件数组
   */
  const createHarvesterBody = function (room: Room): BodyPartConstant[] {
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
  };
  /**
   * 返回运输爬的身体 
   * @param room 生产爬的房间
   * @returns {BodyPartConstant[]} 身体部件数组
   */
  const createCarrierBody = function (room: Room): BodyPartConstant[] {
    let energy = room.energyCapacityAvailable;
    if (energy <= 300) {
      return [CARRY, MOVE];
    }
    let bodys: BodyPartConstant[] = [];
    let carryNum = Math.floor(energy / 150);
    carryNum = carryNum >= 48 ? 48 : carryNum;
    for (let i = 0; i < carryNum; ++i) {
      bodys.push(CARRY, CARRY, MOVE);
    }
    return bodys;
  };
  /**
   * 返回预定者的身体部件数组
   * @returns {BodyPartConstant[]} 身体部件数组
   */
  const createOuterClaimerBody = function (): BodyPartConstant[] {
    return [CLAIM, CLAIM, MOVE, MOVE];
  };
  /**
   * 返回外矿建筑师的身体部件数组
   * @param room 生产 creep 的房间
   * @returns {BodyPartConstant[]} 外矿建筑师的身体部件数组
   */
  const createOuterBuilderBody = function(room: Room): BodyPartConstant[] {
    let energy = room.energyCapacityAvailable;
    let bodysNum = Math.floor(energy / 200);
    let body: BodyPartConstant[] = [];
    for (let i = 0; i < bodysNum; ++i) {
      body.push(WORK, CARRY, MOVE);
    }
    return body;
  };
  /**
   * 返回守护者的名字
   * @param room 目标房间对象
   * @returns {string} 守护者的名字
   */
  const createOuterDefenderName = function (roomName: string) : string {
    return 'defender' + roomName + '_' + Game.time % 10;
  };
  /**
   * 生成采矿爬的名字
   * @param sourceId 目标 source 的ID
   * @returns {string} 采矿爬的名字
   */
  const createHarvesteName = function (roomName: string): string {
    return 'outerHarvester' + roomName + '_' + Game.time % 10;
  };
  /**
   * 生成运输爬的名字
   * @param sourceId 目标 source 的ID
   * @param index 目标 source 的第几个运输爬
   * @returns {string} 运输爬的名字
   */
  const createCarrierName = function (): string {
    return 'outerCarrier' + '_' + Game.time % 100;
  };
  /**
   * 返回预定者的名字
   * @param roomName 目标外矿的房间名
   * @returns 预定者的名字
   */
  const createOuterClaimerName = function (roomName: string): string {
    return 'outerClaimer' + '_' + roomName;
  };
  /**
   * 返回外矿建筑师的名字
   * @param roomName 目标外矿的房间名
   * @returns {string} 外矿建筑师的名字
   */
  const createOuterBuilderName = function(roomName: string): string {
    return 'outerBuilder' + roomName + '_' + Game.time % 10;
  };
  /**
   * 生产外矿守护者
   * @param spawn 空闲的 spawn
   * @param flag 目标 outerSource 外矿的旗子
   * @param bornRoom 生产守护者的房间
   */
  const newOuterDefender = function(flag: Flag, bornRoom: Room): void {
    //  找到空闲的 spawn
    let spawn = context.returnFreeSpawn(bornRoom);
    // 若没有空闲的 spawn,则不检查了
    if (spawn == undefined) {
      return;
    }
    let name = createOuterDefenderName(flag.pos.roomName);
    let body = createOuterDefenderBody(bornRoom);
    let memory = {
      role: 'outerDefender', 
      bornRoom: bornRoom.name,
      outerRoom: flag.pos.roomName,
      flag: {name: flag.name, pos: flag.pos},
    }
    // 生成一个新的守护者
    let result = spawn.spawnCreep(body, name, {
      memory: memory,
      directions: [TOP_LEFT , LEFT, BOTTOM_LEFT],
    });
    return;
  };
  /**
   * 生产一个新的外矿采集者
   * @param spawn 空闲的 spawn
   * @param room 目标外矿对象
   * @param bornRoom 生产 creep 房间对象
   * @param source 目标 source
   */
  const newOuterHarvester = function(
      room: Room, 
      bornRoom: Room, 
      source: Source): void {
    //  找到空闲的 spawn
    let spawn = context.returnFreeSpawn(bornRoom);
    // 若没有空闲的 spawn,则不检查了
    if (spawn == undefined) {
      return;
    }
    let name = createHarvesteName(room.name);
    let body = createHarvesterBody(bornRoom);
    let memory = {
      role: 'outerHarvester', 
      bornRoom: room.name,
      source: {id: source.id, pos: source.pos},
      outerRoom: room.name,
    }
    // 生成一个新的采矿 creep
    let result = spawn.spawnCreep(body, name, {
      memory: memory,
      directions: [TOP_LEFT , LEFT, BOTTOM_LEFT],
    });
    return;
  };
  /**
   * 生产一个新的外矿采集者
   * @param spawn 空闲的 spawn
   * @param room 目标外矿对象
   * @param bornRoom 生产新的外矿采集者的房间对象
   * @param source 目标 source 对象 
   */
  const newOuterCarrier = function(
      room: Room,
      bornRoom: Room, 
      source: Source): void {
    //  找到空闲的 spawn
    let spawn = context.returnFreeSpawn(bornRoom);
    // 若没有空闲的 spawn,则不检查了
    if (spawn == undefined) {
      return;
    }
    let name = createCarrierName();
    let body = createCarrierBody(bornRoom);
    let memory = {
      role: 'outerCarrier', 
      bornRoom: bornRoom.name,
      source: {id: source.id, pos: source.pos},
      outerRoom: room.name,
    };
    // 生成一个新的运输 creep
    let result = spawn.spawnCreep(body, name, {
      memory: memory,
      directions: [TOP_LEFT , LEFT, BOTTOM_LEFT],
    });
    return;
  };
  /**
   * 生产一个新的预定者
   * @param spawn 空闲的 spawn
   * @param room 目标外矿对象
   * @param bornRoom 生产新的预定者的房间对象
   */
  const newOuterClaimer = function(room: Room, bornRoom: Room): void {
    //  找到空闲的 spawn
    let spawn = context.returnFreeSpawn(bornRoom);
    // 若没有空闲的 spawn,则不检查了
    if (spawn == undefined) {
      return;
    }
    let name = createOuterClaimerName(room.name);
    let body = createOuterClaimerBody();
    let memory = {
      role: 'outerClaimer', 
      bornRoom: bornRoom.name,
      outerRoom: room.name,
    };
    // 生成一个新的预定者
    let result = spawn.spawnCreep(body, name, {
      memory: memory,
      directions: [TOP_LEFT , LEFT, BOTTOM_LEFT],
    });
    return;
  };
  /**
   * 生产新的外矿建筑师
   * @param spawn 空闲的 spawn
   * @param room 目标外矿对象
   * @param bornRoom 生产外矿建筑师的房间对象
   */
  const newOuterBuilder = function(room: Room, bornRoom: Room): void {
    //  找到空闲的 spawn
    let spawn = context.returnFreeSpawn(bornRoom);
    // 若没有空闲的 spawn,则不检查了
    if (spawn == undefined) {
      return;
    }
    let name = createOuterBuilderName(room.name);
    let body = createOuterBuilderBody(bornRoom);
    let memory = {
      role: 'outerBuilder',
      bornRoom: bornRoom.name,
      outerRoom: room.name,
    };
    let result = spawn.spawnCreep(body, name, {
      memory: memory,
      directions: [TOP_LEFT , LEFT, BOTTOM_LEFT],
    })
    return;
  };
  /**
   * 检查是否需要产 creep，如果是，则生产 creep
   * @param spawn 目标 spawn
   * @param bornRoom 生成 creep 的房间
   */
  const checkSpawnCreep = function (bornRoom: Room): void {
    // 找到所有名字中含有 outerSource 的旗子
    let flags = Object.keys(Game.flags).filter(key => 
      key.includes('outerSource'));
    for (let i = 0; i < flags.length; ++i) {
      let flag = Game.flags[flags[i]];
      // 获取 flag 所在房间的对象
      let room = flag.room;
      // 检查是否有足够的守护者
      let outerDefender = _.find(Game.creeps, i => 
        i.memory.role == 'outerDefender' 
        && i.memory.outerRoom == flag.pos.roomName
      );
      if (outerDefender == undefined) {
        // 如果不够，则尝试生成一个新的守护者
        newOuterDefender(flag, bornRoom);
        // 返回
        return;
      }
      // 如果没有房间视野则返回,检查下一个外矿
      if (!room) {
        continue;
      }
      // 获取 flag 房间内的所有 source 对象
      let sources = Game.rooms[flag.pos.roomName].find(FIND_SOURCES);
      // 遍历每个能量矿
      for (let source of sources) {
        // 检查是否有足够数量的采矿 creep
        let outerHarvesters = _.filter(Game.creeps, i => 
          i.memory.role == 'outerHarvester' 
          && i.memory.source!.id == source.id
        );
        if (outerHarvesters.length < 1) {
          // 如果不够，则尝试生成一个新的采矿 creep
          newOuterHarvester(room, bornRoom, source);
          // 返回，不再检查其他能量矿
          return;
        }
        // 检查是否有足够数量的运输 creep
        let carriers = _.filter(Game.creeps, i => 
          i.memory.role == 'outerCarrier' 
          && i.memory.source!.id == source.id
        );
        if (carriers.length < 1) {
          // 如果不够，则尝试生成一个新的运输 creep
          newOuterCarrier(room, bornRoom, source);
          // 返回，不再检查其他能量矿
          return;
        }
      }
      // 控制器等级小于4没必要出预定者和建筑师
      if (bornRoom.controller!.level < 4) {
        continue;
      }
      let builderDelay = false;
      if (Memory.delayTime != undefined 
          && Memory.delayTime['outerBuilder' + room.name] != undefined) {
        let delay = Memory.delayTime['outerBuilder' + room.name];
        builderDelay = Game.time <= delay.time + delay.delay;
      }
      // 检查是否有建筑师
      let builder = _.find(Game.creeps, i => 
        i.memory.role == 'outerBuilder' 
        && i.memory.outerRoom == room!.name
      );
      // 如果没有,则新生产一个
      if (builder == undefined && !builderDelay) {
        newOuterBuilder(room, bornRoom);
        return;
      }
      // 检查是否有预定者
      let claimer = _.find(Game.creeps, i => 
        i.memory.role == 'outerClaimer' 
        && i.memory.outerRoom == room!.name
      );
      // 如果预定时间高于3000 则不用那么快生成
      if (room.controller!.reservation != undefined
          && room.controller!.reservation.ticksToEnd > 3000) {
        continue;
      }
      // 如果没有，则生成一个
      if (claimer == undefined) {
        newOuterClaimer(room, bornRoom);
        return;
      }
    }
    return;
  };
  /**
   * 执行采矿爬行为
   * @param creep 目标采矿爬对象
   */
  const runHarvester = function (creep: Creep): void {
    let source = Game.getObjectById(creep.memory.source!.id);
    if (!source) {
      creep.moveTo(new RoomPosition(25, 25, context.room.name), {
        reusePath: 20,
        maxOps: 1000,
      });
      return;
    }
    // 如果不在范围内，则向能量矿移动
    if (creep.pos.getRangeTo(source) > 1) {
      creep.moveTo(source, {
        maxOps: 1000,
      });
      return;
    }
    // 尝试采集能量矿
    let container = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => 
      i.structureType == STRUCTURE_CONTAINER
    ) as StructureContainer[];
    if (container[0] != undefined) {
      if (creep.getActiveBodyparts(WORK) * 4 >
          creep.store.getFreeCapacity()) {
        let result = creep.transfer(container[0], RESOURCE_ENERGY);
        if (result == ERR_FULL) {
          return;
        }
      }
    }
    creep.harvest(source);
    return;
  };
  /**
   * 执行运输爬行为
   * @param creep 目标运输爬对象
   * @param room 将能量带回来的房间，即生产房
   */
  const runCarrier = function (creep: Creep, room: Room): void { 
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
      if (creep.pos.roomName != room.name) {
        creep.moveTo(new RoomPosition(25, 25, room.name), {
          reusePath: 20,
          maxOps: 1000,
        });
        return;
      }
      // 在工作模式下，将能量运输回基地
      let storage = room.storage;
      if (storage != undefined) {
        if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(storage, {
            maxOps: 1000,
          });
        }
        return;
      }
      // 获取基地的 container 对象
      let container = _.filter(room.find(FIND_STRUCTURES), i =>
        i.structureType == STRUCTURE_CONTAINER
        && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      ) as StructureContainer[];
      // 获取最近的 container 对象
      let target = creep.pos.findClosestByRange(container);
      // 如果没有找到最近的对象，说明并不在基地房间里，则向基地移动
      if (target == null) {
        return;
      }
      // 尝试将能量转移给 container
      let result = creep.transfer(target, RESOURCE_ENERGY);
      // 如果不在范围内，则向 container 移动
      if (result == ERR_NOT_IN_RANGE) {
        creep.moveTo(target, {
          maxOps: 1000,
        });
      }
    } else {
      // 根据 id 获取能量矿对象
      let source = Game.getObjectById(creep.memory.source!.id)!;
      // 如果没有找到能量矿对象，说明没有房间视野，则向 flag 移动
      if (!source) {
        creep.moveTo(source, {
          maxOps: 1000,
        });
        return;
      }
      // 在非工作模式下，从 container 或地上掉落的资源中获取能量
      // 获取能量矿旁边的 container 对象
      let container = source.pos.findInRange(FIND_STRUCTURES, 2, {
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
        creep.moveTo(source, {
          maxOps: 1000,
        });
        return;
      }
      // 尝试从 container 中取出能量
      let result = 0;
      if (container) {
        result = creep.withdraw(container, RESOURCE_ENERGY);
        // 如果不在范围内，则向 container 移动
        if (result == ERR_NOT_IN_RANGE) {
          creep.moveTo(container, {
            maxOps: 1000,
          });
        }
      } else {
        result = creep.pickup(resource);
        // 如果不在范围内，则向 resource 移动
        if (result == ERR_NOT_IN_RANGE) {
          creep.moveTo(resource, {
            maxOps: 1000,
          });
        }
      }
    }
    return;
  };
  /**
   * 执行预定者任务
   * @param creep 预定者对象
   */
  const runOuterClaimer = function (creep: Creep): void {
    // 获取控制器对象
    let room = Game.rooms[creep.memory.outerRoom!];
    // 如果没有找到房间对象，说明没有房间视野，则向该房间移动
    if (!room) {
      creep.moveTo(new RoomPosition(25, 25, creep.memory.outerRoom!), {
        maxOps: 1000,
        reusePath: 20,
      });
      return;
    }
    // 尝试预定控制器,若不够距离则移动至控制器
    let controller = room.controller!
    if (creep.reserveController(controller) == ERR_NOT_IN_RANGE) {
      creep.moveTo(controller, {
        maxOps: 1000,
      });
      return;
    }
    if (controller.sign == undefined 
        || controller.sign.username != creep.owner.username) {
      creep.signController(controller, "This is my outer room");
    }
    return;
  };
  /**
   * 守护者执行守护外矿任务
   * @param creep 守护者对象
   */
  const runOuterDefender = function (creep: Creep): void {
    if (creep.pos.roomName != creep.memory.outerRoom) {
      creep.moveTo(new RoomPosition(25, 25, creep.memory.outerRoom!), {
        maxOps: 1000,
      });
      return;
    }
    let room = Game.rooms[creep.memory.outerRoom!];
    let enemies = _.filter(room.find(FIND_HOSTILE_CREEPS), i =>
      i.body.find(i => 
        i.type == ATTACK 
        || i.type == RANGED_ATTACK
        || i.type == HEAL
      )
    );
    if (enemies.length == 0) {
      creep.moveTo(creep.memory.flag!.pos.x, creep.memory.flag!.pos.y, {
        maxOps: 1000,
      });
      return;
    }
    let target = creep.pos.findClosestByRange(enemies)!;
    if (creep.attack(target) == ERR_NOT_IN_RANGE) {
      creep.moveTo(target, {
        maxOps: 1000,
      });
    }
    return;
  };
  const runOuterBuilder = function(creep: Creep) {
    if (creep.pos.roomName == creep.memory.bornRoom) {
      if (creep.store[RESOURCE_ENERGY] == 0) {
        let room = Game.rooms[creep.memory.bornRoom]
        let result = creep.withdraw(room.storage!, RESOURCE_ENERGY);
        if (result == ERR_NOT_IN_RANGE) {
          creep.moveTo(room.storage!);
        }
        return;
      }
    }
    if (creep.pos.roomName != creep.memory.outerRoom) {
      creep.moveTo(new RoomPosition(25, 25, creep.memory.outerRoom!), {
        maxOps: 1000,
      });
      return;
    }
    let room = Game.rooms[creep.pos.roomName];
    if (creep.store[RESOURCE_ENERGY] == 0) {
      let container = room.find(FIND_STRUCTURES, {
          filter: s => s.structureType == STRUCTURE_CONTAINER
          && s.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()
      })[0];
      // 获取 source 旁边掉落的资源对象
      let resource = room.find(FIND_DROPPED_RESOURCES, {
        filter: s => s.resourceType == RESOURCE_ENERGY
        && s.amount >= creep.store.getFreeCapacity()
      })[0];
      if (container != undefined) {
        if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(container);
        }
      } else if (resource != undefined) {
        if (creep.pickup(resource) == ERR_NOT_IN_RANGE) {
          creep.moveTo(resource);
        }
      }
      return;
    }
    let sites = room.find(FIND_CONSTRUCTION_SITES);
    let target = creep.pos.findClosestByRange(sites);
    if (target != undefined) {
      if (creep.build(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      return;
    }
    let repairs = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => 
      i.hits < i.hitsMax
    );
    if (repairs[0] != undefined) {
      creep.repair(repairs[0]);
      return;
    }
    let repairTargets = _.filter(room.find(FIND_STRUCTURES), i => 
      i.hits < i.hitsMax
    );
    let repairTarget = creep.pos.findClosestByRange(repairTargets);
    if (repairTarget != undefined) {
      if (creep.repair(repairTarget) == ERR_NOT_IN_RANGE) {
        creep.moveTo(repairTarget);
      }
    } else {
      creep.suicide();
      if (Memory.delayTime == undefined) {
        Memory.delayTime = {};
      }
      if (Memory.delayTime['outerBuilder' + room.name] == undefined) {
        Memory.delayTime['outerBuilder' + room.name] = {
          time: 0,
          delay: 0,
        };
      }
      Memory.delayTime['outerBuilder' + room.name] = {
        time: Game.time, 
        delay: 2000, 
      };
    }
    return;
  };
  run();
}
