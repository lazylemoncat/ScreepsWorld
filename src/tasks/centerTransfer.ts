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
    // 检查是否需要生成新的运输爬
    this.checkSpawnCreep(room);
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
  createCenterTransfererBody: function (room: Room): BodyPartConstant[] {
    if (room.controller!.level < 6) {
      return [CARRY];
    }
    let carryNum = room.energyAvailable / 50;
    carryNum = carryNum > 10 ? 10 : carryNum;
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
  createCenterTransfererName: function (room: Room): string {
    return "centerTransferer" + room.name + '_' + Game.time % 10
  },
  newCenterTransferer: function(room: Room) {
    let spawn = spawns.isFreeFirstSpawn(room);
    if (!spawn) {
      return;
    }
    let name = this.createCenterTransfererName(room);
    let body = this.createCenterTransfererBody(room);
    let memory = { 
      role: 'centerTransferer',
      bornRoom: room.name,
    };
    let result = spawn.spawnCreep(body, name, {
      memory: memory,
      directions: [TOP_RIGHT, BOTTOM_RIGHT],
    });
    return;
  },
  /**
   * 检查是否需要生产新的中央运输爬
   * @param spawn 执行生产任务的 spawn
   * @param room 执行任务的房间
   */
  checkSpawnCreep: function (room: Room): void {
    let centerTransferer = _.filter(room.find(FIND_MY_CREEPS), i =>
        i.memory.role == "centerTransferer");
    if (centerTransferer.length < 2) {
      this.newCenterTransferer(room);
      return;
    }
    return;
  },
  /**
   * 中央运输爬执行运输任务
   * @param creep 目标中央运输爬
   * @param room 执行任务的房间
   */
  runCenterTransferer: function (creep: Creep, room: Room): void {
    if (this.transferEnergy(creep, room)) {
      return;
    }
    if (!room.terminal || creep.pos.getRangeTo(room.terminal) > 1) {
      return;
    }
    if (creep.store.getUsedCapacity() > 0) {
      this.transferResource(creep, room, room.terminal);
    } else {
      this.withdrawResource(creep, room, room.terminal);
    }
    return;
  },
  withdrawEnergy: function(creep: Creep, room: Room): void {
    let terminalEnergy = Memory.rooms[room.name].terminalTask.energy;
    let centerLink = Game.getObjectById(Memory.rooms[room.name].centerLink);
    let target = centerLink != undefined 
        && centerLink.store[RESOURCE_ENERGY] > 50 
        && room.storage
        && (creep.pos.getRangeTo(room.storage) != 1
            || centerLink.store[RESOURCE_ENERGY] > 400)
      ? centerLink : creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => 
        "store" in i 
        && i.store[RESOURCE_ENERGY] > 0
        && (i.structureType == STRUCTURE_CONTAINER 
            || (i.structureType == STRUCTURE_LINK
                && room.storage
                && creep.pos.getRangeTo(room.storage) == 1)
            || (i.structureType == STRUCTURE_STORAGE 
                && i.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()
                && !(room.terminal 
                && room.terminal.store[RESOURCE_ENERGY] > terminalEnergy))
            || (i.structureType == STRUCTURE_TERMINAL
                && i.store[RESOURCE_ENERGY] > terminalEnergy)
          )
      )
    [0] as AnyStoreStructure;
    if (target == undefined) {
      return;
    }
    if (target.structureType == STRUCTURE_TERMINAL) {
      let amount = target.store[RESOURCE_ENERGY] - terminalEnergy;
      amount = amount > creep.store.getFreeCapacity() ? 
        creep.store.getFreeCapacity() : amount;
      creep.withdraw(target, RESOURCE_ENERGY, amount);
      return;
    } else if (target.structureType == STRUCTURE_LINK) {
      if (creep.pos.getRangeTo(room.storage!) == 1) {
        let amount = target.store[RESOURCE_ENERGY] - 400;
        amount = creep.store.getFreeCapacity() < amount ? 
          creep.store.getFreeCapacity() : amount;
        creep.withdraw(target, RESOURCE_ENERGY, amount);
      } else {
        creep.withdraw(target, RESOURCE_ENERGY);
      }
      return;
    }
    creep.withdraw(target, RESOURCE_ENERGY);
    return;
  },
  transferEnergy: function(creep: Creep, room: Room): boolean {
    let terminalEnergy = Memory.rooms[room.name].terminalTask.energy;
    let centerLink = Game.getObjectById(Memory.rooms[room.name].centerLink);
    let target = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => 
      "store" in i 
      && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      && (i.structureType == STRUCTURE_EXTENSION
          || i.structureType == STRUCTURE_LINK 
          && i.store[RESOURCE_ENERGY] < 400
          || i.structureType == STRUCTURE_SPAWN
          || (i.structureType == STRUCTURE_STORAGE 
            && (i.store[RESOURCE_ENERGY] < 50000
                || room.terminal 
                && room.terminal.store[RESOURCE_ENERGY] > terminalEnergy
                || centerLink
                && centerLink.store[RESOURCE_ENERGY] > 400)
            )
          || (i.structureType == STRUCTURE_TERMINAL
              && i.store[RESOURCE_ENERGY] < terminalEnergy)
        )
    )[0] as AnyStoreStructure | undefined;
    if (target == undefined) {
      return false;
    }
    if (creep.store[RESOURCE_ENERGY] == 0) {
      if (creep.store.getFreeCapacity() == 0) {
        let type = Object.keys(creep.store)[0] as ResourceConstant;
        creep.transfer(room.storage!, type);
        return true;
      }
      this.withdrawEnergy(creep, room);
      return true;
    }
    if (target.structureType == STRUCTURE_LINK) {
      let amount = Math.min(400 - target.store[RESOURCE_ENERGY], 
        creep.store[RESOURCE_ENERGY]);
      creep.transfer(target, RESOURCE_ENERGY, amount);
      return true;
    }
    creep.transfer(target, RESOURCE_ENERGY);
    return true;
  },
  withdrawResource: function(
      creep: Creep, 
      room: Room, 
      terminal: StructureTerminal) {
    let resource = Object.keys(terminal.store).find(i => 
      !Memory.rooms[room.name].terminalTask.hasOwnProperty(i)
      || Memory.rooms[room.name].terminalTask.hasOwnProperty(i)
        && Memory.rooms[room.name].terminalTask[i] 
          < terminal.store[i as ResourceConstant]
    ) as ResourceConstant;
    if (resource != undefined) {
      let amount = creep.store.getFreeCapacity();
      if (Memory.rooms[room.name].terminalTask[resource] != undefined) {
        amount = Math.min(terminal.store[resource] 
          - Memory.rooms[room.name].terminalTask[resource], amount);
      } else { 
        amount = amount > terminal.store[resource] 
          ? terminal.store[resource] : amount;
      }
      creep.withdraw(terminal, resource, amount);
      return;
    }
    resource = Object.keys(room.storage!.store).find(i => 
      Memory.rooms[room.name].terminalTask.hasOwnProperty(i)
        && Memory.rooms[room.name].terminalTask[i] 
          > terminal.store[i as ResourceConstant]
    ) as ResourceConstant;
    if (resource != undefined) {
      let amount = creep.store.getFreeCapacity();
      if (Memory.rooms[room.name].terminalTask[resource] != undefined) {
        amount = Math.min(Memory.rooms[room.name].terminalTask[resource]
          - terminal.store[resource], amount);
      }
      creep.withdraw(room.storage!, resource, amount);
      return;
    }
    return;
  },
  transferResource: function(
      creep: Creep, 
      room: Room, 
      terminal: StructureTerminal) {
    let resource = Object.keys(creep.store)[0] as ResourceConstant;
    let amount = creep.store[resource];
    if (Memory.rooms[room.name].terminalTask[resource] != undefined) {
      let del = Memory.rooms[room.name].terminalTask[resource]
      - terminal.store[resource];
      if (del > 0) {
        amount = amount - del > 0 ? del : amount;
        creep.transfer(terminal, resource, amount);
        return;
      }
    }
    creep.transfer(room.storage!, resource);
    return;
  },
}