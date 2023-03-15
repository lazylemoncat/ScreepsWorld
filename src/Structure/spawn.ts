export const spawn = {
  returnFreeSpawn: function(room: Room): StructureSpawn[] | null {
    let spawns = room.find(FIND_STRUCTURES).filter(i => i.structureType == STRUCTURE_SPAWN) as StructureSpawn[];
    let freeSpawns: StructureSpawn[] = [];
    for (let i = 0; i < spawns.length; i++) {
      let spawn = spawns[i];
      if (spawn.spawning != null) {
        spawn.memory.spawning = false;
        continue;
      }
      if (!spawn.memory.spawning) {
        freeSpawns.push(spawn);
      }
    }
    if (freeSpawns.length == 0) {
      return null;
    } else {
      return freeSpawns;
    }
  },
  spawnCreep(role: string, room: Room, spawn: StructureSpawn): void {
    let newName = role + Game.time;
    let resSpawn = -1;
    switch (role) {
      case 'harvester':
      case 'builder':
      case 'upgrader': {
        let index = returnFreeSource(role, room);
        let memory = {role: role, room: room.name, source: room.memory.sources[index]};
        let bodys = returnBodys(role, room.energyCapacityAvailable, room);
        resSpawn = spawn.spawnCreep(bodys, newName, {memory: memory});
        if (resSpawn == OK) {
          spawn.memory.spawning = true;
        }
        break;
      }
      case 'repairer':
      case 'transferer': {
        let memory = {role: role, room: room.name};
        let bodys = returnBodys(role, room.energyCapacityAvailable, room);
        resSpawn = spawn.spawnCreep(bodys, newName, {memory: memory});
        if (resSpawn == OK) {
          spawn.memory.spawning = true;
        }
        break;
      }
    }
    if (resSpawn == OK) {
      spawn.memory.spawning = true;
      (room.memory as any)[role+'s'].push(newName);
    }
    return;
  }
}

function returnBodys(role: string, capacity: number, room: Room): BodyPartConstant[] {
  if (capacity == 300 || room.find(FIND_CREEPS).length < 4 ) {
    switch (role) {
      case 'harvester' : return [WORK, CARRY, MOVE];
      case 'upgrader' : return [WORK, CARRY, MOVE];
      case 'builder' : return [WORK, CARRY, MOVE];
      case 'transferer' : return [CARRY, CARRY, MOVE];
      case 'repairer' : return [WORK, CARRY, MOVE];
    }
  } else {
    switch (role) {
      case 'harvester': {
        let bodys: BodyPartConstant[] = [WORK, CARRY, MOVE];
        capacity /= 50;
        capacity -= 4;
        for (; capacity >= 5; capacity -= 5) {
          bodys.push(WORK, WORK, MOVE);
          if (bodys.length >= 9) {
            break;
          }
        }
        return bodys;
      }
      case 'upgrader': {
        let bodys: BodyPartConstant[] = [];
        capacity /= 50;
        bodys.push(WORK, WORK, CARRY, MOVE);
        capacity -= 6;
        for (; capacity >= 5; capacity -= 5) {
          bodys.push(WORK, WORK, MOVE);
          if (bodys.length == 9) break;
        }
        return bodys;
      }
      case 'builder': {
        let bodys: BodyPartConstant[] = [];
        for (capacity /= 50; capacity >= 4; capacity -= 4) {
          bodys.push(WORK, CARRY, MOVE);
          if (bodys.length == 12) break;
        }
        return bodys;
      }
      case 'transferer': {
        let bodys: BodyPartConstant[] = [];
        for (capacity /= 50; capacity >= 2; capacity -= 2) {
          bodys.push(MOVE, CARRY);
          if (bodys.length == 12) break;
        }
        return bodys;
      }
      case 'repairer': {
        let bodys: BodyPartConstant[] = [];
        for (capacity /= 50; capacity >= 4; capacity -= 4) {
          bodys.push(WORK, CARRY, MOVE);
          if (bodys.length == 12) break;
        }
        return bodys;
      }
      case 'claimer': {
        if (capacity >= 650) {
          return [CLAIM, MOVE];
        } else {
          return [];
        }
      }
    }
  }
  return [];
}

function returnFreeSource(role: string, room: Room) {
  let index = 0;
  let creeps = (room.memory as any)[role+'s'];
  for (let i = 0; i < room.memory.sources.length; i++) {
    let source = Game.getObjectById(room.memory.sources[i]);
    for (let j = 0; j < creeps.length; j++) {
      let creep = Game.creeps[creeps[i]];
      if (creep == null) {
        continue
      }
      if (source!.id == creep.memory.source) {
        index = -1;
        continue;
      } else {
        index = i;
      }
    }
    if (index != -1) {
      break;
    } else {
      index = i + 1;
    }
  }
  return index == -1 ? 0 : index;
}