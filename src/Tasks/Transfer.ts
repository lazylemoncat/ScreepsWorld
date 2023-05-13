import { returnFreeSpawn} from "../structures/spawns";

export const transferTask = function(room: Room) {
  const run = function() {
    checkSpawnCreep();
    runCarrier();
    runMineralCarrier();
    return;
  };
  const createCarrierName = function(): string {
    return 'carrier' + room.name + '_' + Game.time % 10;
  };
  const createMineralCarrierName = function() {
    return 'mineralCarrier' + room.name + '_' + Game.time % 10;
  };
  const createCarrierBody = function(): BodyPartConstant[] {
    let energy = room.energyAvailable;
    if (energy <= 300) {
      return [CARRY, CARRY, MOVE];
    }
    let bodys: BodyPartConstant[] = [];
    let bodysNum = Math.floor(energy / 150);
    bodysNum = bodysNum >= 6 ? 6 : bodysNum;
    for (let i = 0; i < bodysNum; ++i) {
      bodys.push(CARRY, CARRY, MOVE);
    }
    return bodys;
  };
  const createMineralCarrierBody = function() {
    let energy = room.energyAvailable;
    if (energy <= 300) {
      return [CARRY, CARRY, MOVE];
    }
    let bodys: BodyPartConstant[] = [];
    let bodysNum = Math.floor(energy / 150);
    bodysNum = bodysNum >= 6 ? 6 : bodysNum;
    for (let i = 0; i < bodysNum; ++i) {
      bodys.push(CARRY, CARRY, MOVE);
    }
    return bodys;
  };
  const newCarrier = function(): void {
    let spawn = returnFreeSpawn(room);
    if (spawn == undefined) {
      return;
    }
    let name = createCarrierName();
    let body = createCarrierBody();
    let memory: CreepMemory = {
      role: 'carrier',
      bornRoom: room.name,
    }
    spawn.spawnCreep(body, name, {
      memory,
      directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
    });
    return;
  };
  const newMineralCarrier = function() {
    let spawn = returnFreeSpawn(room);
    if (spawn == undefined) {
      return;
    }
    let name = createMineralCarrierName();
    let body = createCarrierBody();
    let memory: CreepMemory = {
      role: 'mineralCarrier',
      bornRoom: room.name,
    };
    spawn.spawnCreep(body, name, {
      memory,
      directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
    })
    return;
  };
  const checkSpawnCreep = function() {
    let carriers = _.filter(Game.creeps, (creep) => 
      creep.memory.role == "carrier");
    if (carriers.length < 2) {
      newCarrier();
    }
    let extractor = _.find(room.find(FIND_STRUCTURES), i =>
      i.structureType == STRUCTURE_EXTRACTOR
    );
    if (room.controller!.level < 6 || !extractor) {
      return;
    }
    let mineralCarriers =  _.find(Game.creeps, (creep) => 
      creep.memory.role == "mineralCarrier");
    if (mineralCarriers == undefined) {
      newMineralCarrier();
    }
    return;
  };
  const findTransferTarget = function(): AnyStoreStructure[] {
    let centerSpawnPos = room.find(FIND_MY_SPAWNS)[0].pos;
    let centerExtensions = _.filter(room.lookForAtArea(LOOK_STRUCTURES, 
      centerSpawnPos.y - 2, centerSpawnPos.x, centerSpawnPos.y + 2, 
      centerSpawnPos.x + 2, true), i => 
        i.structure.structureType == STRUCTURE_EXTENSION
    ).map(i => i.structure.id) as Id<StructureExtension>[];
    let transferTargets = _.filter(room.find(FIND_STRUCTURES), (i) => 
      "store" in i 
      && i.store["energy"] < i.store.getCapacity("energy") 
      && (
        i.structureType == "spawn" 
        || (
          i.structureType == "extension" 
          && i.pos.findInRange(FIND_SOURCES, 2).length == 0
          && !centerExtensions.includes(i.id)
        )
        || (i.structureType == "tower" && i.store[RESOURCE_ENERGY] < 600)
        || (i.structureType == "lab" && i.store[RESOURCE_ENERGY] < 1500)
        || (i.structureType == "container" 
            && i.store[RESOURCE_ENERGY] < 1500
            && i.pos.findInRange(FIND_SOURCES, 2).length == 0
            && i.pos.findInRange(FIND_MINERALS, 1).length == 0
          )
      )
    ) as AnyStoreStructure[];
    return transferTargets;
  };
  const findWithdrawTarget = function() {
    let containers = _.filter(room.find(FIND_STRUCTURES), (i) =>
      i.structureType == "container"
      && i.store["energy"] > 0
      && i.pos.findInRange(FIND_SOURCES, 2)[0] != undefined
    ) as StructureContainer[];
    let storage = room.storage;
    if (storage == undefined) {
      return containers;
    }
    return [...containers, storage];
  };
  const runCarrier = function() {
    let creeps = _.filter(Game.creeps, (creep) => 
      creep.memory.role == "carrier");
    let transferTargets = findTransferTarget();
    let withdrawTargets = findWithdrawTarget();
    if (transferTargets.length == 0) {
      withdrawTargets.splice(withdrawTargets.indexOf(room.storage!), 1)
    }
    for (let i = 0; i < creeps.length; ++i) {
      let creep = creeps[i];
      if (creeps[i].store.getUsedCapacity() == 0) {
        let target = creeps[i].pos.findClosestByRange(
          withdrawTargets.filter(target => 
            target.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity())
        );
        if (target == undefined) {
          continue;
        }
        if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(target);
        }
        continue;
      }
      if (transferTargets.length == 0) {
        if (room.storage != undefined) {
          transferTargets.push(room.storage);
        }
      }
      let target = creep.pos.findClosestByRange(transferTargets);
      if (target == undefined) {
        continue;
      }
      creep.say(target.structureType)
      transferTargets.splice(transferTargets.indexOf(target), 1);
      if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
        continue;
      }
      if (creep.store[RESOURCE_ENERGY] 
          - target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        creep.store[RESOURCE_ENERGY] 
          -= target.store.getFreeCapacity(RESOURCE_ENERGY);
        --i;
      }
    }
  };
  const runMineralCarrier = function() {
    let creep = _.find(Game.creeps, (creep) => 
      creep.memory.role == "mineralCarrier");
    if (creep == undefined) {
      return;
    }
    if (transferLab(creep) || withdrawLab(creep)) {
      return;
    }
    let mineral = room.find(FIND_MINERALS)[0];
    let container = _.find(room.find(FIND_STRUCTURES), i => 
      i.structureType == STRUCTURE_CONTAINER
      && i.pos.getRangeTo(mineral) == 1
    ) as StructureContainer;
    let resource = Object.keys(container.store)[0] as ResourceConstant;
    if (creep.store.getUsedCapacity() == 0) {
      if (creep.withdraw(container, resource) == ERR_NOT_IN_RANGE) {
        creep.moveTo(container);
      } else if (container.store.getUsedCapacity() == 0) {
        if (creep.pos.getRangeTo(container) > 1) {
          creep.moveTo(container);
        }
      }
      return;
    }
    transferStorage(creep);
    return;
  };
  const transferStorage = function(creep: Creep) {
    let storage = room.storage;
    if (storage == undefined) {
      return;
    }
    let resource = Object.keys(creep.store)[0] as ResourceConstant;
    if (creep.transfer(storage, resource) == ERR_NOT_IN_RANGE) {
      creep.moveTo(storage);
    }
    return;
  };
  const transferLab = function(creep: Creep): boolean {
    let labId = Memory.rooms[room.name].labId;
    let substrateLabs = labId.substrateLabs.map(i => 
      Game.getObjectById(i as Id<StructureLab>)
    ) as StructureLab[];
    if (substrateLabs.length < 2) {
      return false;
    }
    let reaction = Memory.rooms[room.name].labTask;
    let resource1 = reaction.type.lab1 as ResourceConstant;
    let resource2 = reaction.type.lab2 as ResourceConstant;
    if (substrateLabs[0].store[resource1] 
        < reaction.amount
        && substrateLabs[0].store[resource1] 
        < 2000) {
      if (creep.store.getUsedCapacity() > 0) {
        if (Object.keys(creep.store)[0] != reaction.type.lab1) {
          transferStorage(creep);
          return true;
        }
        if (creep.transfer(substrateLabs[0], resource1) == ERR_NOT_IN_RANGE) {
          creep.moveTo(substrateLabs[0]);
        }
        return true;
      }
      if (creep.withdraw(room.storage!, resource1) == ERR_NOT_IN_RANGE) {
        creep.moveTo(room.storage!);
      }
      return true;
    } else if (substrateLabs[1].store[resource2] 
        < reaction.amount
        && substrateLabs[1].store[resource2] 
        < 2000) {
      if (creep.store.getUsedCapacity() > 0) {
        if (Object.keys(creep.store)[0] != reaction.type.lab2) {
          transferStorage(creep);
          return true;
        }
        if (creep.transfer(substrateLabs[1], resource2) == ERR_NOT_IN_RANGE) {
          creep.moveTo(substrateLabs[1]);
        }
        return true;
      }
      if (creep.withdraw(room.storage!, resource2) == ERR_NOT_IN_RANGE) {
        creep.moveTo(room.storage!);
      }
      return true;
    } else {
      return false;
    }
  };
  const withdrawLab = function(creep: Creep): boolean {
    let labId = Memory.rooms[room.name].labId;
    let reactionLabs = labId.reactionLabs.map(i => 
      Game.getObjectById(i as Id<StructureLab>)
    ) as StructureLab[];
    if (reactionLabs.length < 1) {
      return false;
    }
    for (let i = 0; i < reactionLabs.length; ++i) {
      let resource = Object.keys(reactionLabs[i].store).find(i => 
        i != RESOURCE_ENERGY) as ResourceConstant;
      if (!resource || reactionLabs[i].store[resource] < 1000) {
        continue;
      }
      if (creep.store.getUsedCapacity() > 0) {
        transferStorage(creep);
        return true;
      }
      if (creep.withdraw(reactionLabs[i], resource) == ERR_NOT_IN_RANGE) {
        creep.moveTo(reactionLabs[i]);
      }
      return true;
    }
    return false;
  };
  run();
}