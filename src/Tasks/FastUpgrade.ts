import { MyMemory } from "@/Memory/MyMemory";
import { SpawnCreep } from "./SpawnCreep";

export const FastUpgrade = {
  run: function (room: Room) {
    let workers = _.filter(room.find(FIND_MY_CREEPS), i => 
      i.memory.role == "worker");
    let sources = room.find(FIND_SOURCES);
    let sourcePoints = [0, 0];
    let pointsSum = 0;
    for (let i = 0; i < sources.length; ++i) {
      sourcePoints[i] = this.findFreePoint(sources[i].pos, room);
      pointsSum += sourcePoints[i];
    }
    if (workers.length < pointsSum) {
      let sourceId: Id<Source> = sources[0].id;
      for (let i = 0; i < sources.length; ++i) {
        let id = sources[i].id;
        let temp = workers.filter(creep => creep.name.indexOf(id) != -1);
        if (temp.length >= sourcePoints[i]) {
          continue;
        } else {
          sourceId = id;
          break;
        }
      }
      this.newCreep(room, sourceId);
    }
    for (let i = 0; i < workers.length; ++i) {
      if (MyMemory.upateWorking(workers[i], "energy")) {
        if (this.transferEnergy(workers[i], room)) {
          continue;
        }
        if (i != workers.length - 1) {
          if (this.goBuild(workers[i], room)) {
            continue;
          }
        }
        this.goUpgrade(workers[i], room);
      } else {
        this.goHarvest(workers[i], room);
      }
    }
  },
  newCreep: function (room: Room, sourceId: Id<Source>) {
    let newListPush: {
      role: string,
      bodys: BodyPartConstant[],
      opt?: Id<Source>
    } = {
      role: "worker",
      bodys: this.returnBodys(room),
    }
    if (sourceId != undefined) {
      newListPush.opt = sourceId
    }
    SpawnCreep.newList.push(newListPush);
  },
  goHarvest: function (creep: Creep, room: Room) {
    let sources = room.find(FIND_SOURCES);
    let source = sources.find(i => creep.name.indexOf(i.id) != -1);
    if (source == undefined) {
      creep.say("ERR_NOT_FOUND_SOURCE");
      return;
    }
    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    }
    return;
  },
  goUpgrade: function (creep: Creep, room: Room) {
    //if (this.goBuild(creep, room)) {
    //  return;
    //}
    let controller = room.controller!;
    if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
      creep.moveTo(controller);
    }
    if (controller.sign == undefined 
      || controller.sign.username != creep.owner.username) {
      if (creep.signController(controller, "Declare war on PB!")
        == ERR_NOT_IN_RANGE) {
        creep.moveTo(controller);
      }
    }
    return;
  },
  goBuild: function (creep: Creep, room: Room): boolean {
    let sites = room.find(FIND_CONSTRUCTION_SITES);
    if (sites.length == 0) {
      return false;
    }
    if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
      creep.moveTo(sites[0]);
    }
    return true;
  },
  transferToExtension: function (creep: Creep, room: Room): boolean {
    let extensions = _.filter(room.find(FIND_STRUCTURES), i =>
      i.structureType == "extension"
      && i.store.getFreeCapacity("energy") > 0) as StructureExtension[];
    if (extensions.length == 0) {
      return false;
    }
    if (creep.transfer(extensions[0], "energy") == ERR_NOT_IN_RANGE) {
      creep.moveTo(extensions[0]);
    }
    return true;
  },
  transferEnergy: function (creep: Creep, room: Room): boolean {
    if (this.transferToExtension(creep, room)) {
      return true;
    }
    let spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn.store.getFreeCapacity("energy") == 0) {
      return false;
    }
    if (creep.transfer(spawn, "energy") == ERR_NOT_IN_RANGE) {
      creep.moveTo(spawn);
    }
    return true;
  },
  returnBodys: function (room: Room): BodyPartConstant[] {
    let energy = room.energyAvailable;
    let bodys = [WORK, WORK, CARRY, MOVE, MOVE, MOVE];
    if (energy < 400) {
      bodys = [WORK, CARRY, MOVE];
      return bodys;
    } else if (energy >= 450) {
      bodys = [WORK, WORK, WORK, CARRY, MOVE, MOVE];
    }
    return bodys;
  },
  findFreePoint: function (pos: RoomPosition, room: Room) {
    let top = pos.y - 1;
    let left = pos.x - 1;
    let bottom = pos.y + 1;
    let right = pos.x + 1;
    let area = room.lookForAtArea("terrain", top, left, bottom, right, true);
    let count = 0;
    for (let i = 0; i < 9; ++i) {
      if (area[i].terrain == "plain" || area[i].terrain == "swamp") {
        count += 1;
      }
    }
    return count;
  },
}