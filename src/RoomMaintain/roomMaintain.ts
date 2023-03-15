import { spawn } from "@/Structure/spawn";
import { build } from "./build";
import { harvest } from "./harvest";
import { repair } from "./repair";
import { sites } from "./sites";
import { transfer } from "./transfer";
import { upgrade } from "./upgrade";

/**
 * do something
 * @return void
 * @author LazyKitty
 */
export const roomMaintain = {
  run: function(): void {
    for(let name in Game.rooms) {
      let room = Game.rooms[name];
      if (room.controller == undefined || !room.controller.my) {
        continue;
      }
      initRoom(room);
      sites.run(room);
      newCreep(room);
      harvest.run(room);
      build.run(room);
      upgrade.run(room);
      transfer.run(room);
      repair.run(room);
    }
  }
}

function initRoom(room: Room): void {
  if (room.memory.isInit == true) {
    return;
  }
  room.memory.sources = room.find(FIND_SOURCES).map(i => i.id);
  room.memory.harvesters = [];
  room.memory.builders = [];
  room.memory.upgraders = [];
  room.memory.transferers = [];
  room.memory.repairers = [];
  room.memory.towers = [];
  room.memory.sites = {init: 0};
  room.memory.isInit = true;

  return;
}

function newCreep(room: Room): void {
  let spawns = spawn.returnFreeSpawn(room);
  let index = 0;
  if (spawns == null) {
    return;
  }
  if (room.memory.harvesters.length < room.memory.sources.length) {
    for (let i = room.memory.harvesters.length; i < room.memory.sources.length; i++) {
      if (index == spawns.length) {
        return;
      }
      spawn.spawnCreep('harvester', room, spawns[index++]);
    }
  }

  let sites = room.find(FIND_CONSTRUCTION_SITES);
  if (sites.length > 0 && room.memory.builders.length < 2) {
    for (let i = room.memory.builders.length; i < 2; i++) {
      if (index == spawns.length) {
        return;
      }
      spawn.spawnCreep('builder', room, spawns[index++]);
    }
  }

  if (room.memory.upgraders.length < 2) {
    for (let i = room.memory.upgraders.length; i < (sites.length > 0 ? 1 : 2); i++) {
      if (index == spawns.length) {
        return;
      }
      spawn.spawnCreep('upgrader', room, spawns[index++]);
    }
  }

  let container = room.find(FIND_STRUCTURES).some(i => i.structureType == STRUCTURE_CONTAINER);
  if (container && room.memory.transferers.length < room.memory.sources.length) {
    for (let i = room.memory.transferers.length; i < room.memory.sources.length; i++) {
      if (index == spawns.length) {
        return;
      }
      spawn.spawnCreep('transferer', room, spawns[index++]);
    }
  }

  if (container && room.memory.repairers.length < 1) {
    for (let i = room.memory.repairers.length; i < 1; i++) {
      if (index == spawns.length) {
        return;
      }
      spawn.spawnCreep('repairer', room, spawns[index++]);
    }
  }

  
  return;
}