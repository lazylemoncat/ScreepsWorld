import { min } from "lodash";
import { Harvester } from "./Roles/Harvester";
import { Mineraler } from "./Roles/Mineraler";
import { SpawnCreep } from "./SpawnCreep";

export const Harvest = {
  run: function (room: Room) {
    let sources = room.find(FIND_SOURCES);
    let harvesters = _.filter(room.find(FIND_MY_CREEPS), (creep) => 
      creep.memory.role == "harvester");
    if (harvesters.length < sources.length) {
      let sourceId: Id<Source> = sources[0].id;
      for (let i = 0; i < sources.length; ++i) {
        let id = sources[i].id;
        if (harvesters.find(creep => creep.name.indexOf(id) != -1)) {
          continue;
        } else {
          sourceId = id;
          break;
        }
      }
      let newListPush = {
        role: "harvester",
        bodys: this.returnBodys(room, "harvester"),
        opt: sourceId,
      }
      SpawnCreep.newList.push(newListPush);
    }
    if (harvesters.length == 0) {
      return;
    } 
    for (let i = 0; i < sources.length; ++i) {
      let id = sources[i].id;
      let harvester = harvesters.find(creep => creep.name.indexOf(id) != -1);
      if (harvester != undefined) {
        Harvester.run(sources[i], room, harvester);
      }
    }
    let extractor = _.filter(room.find(FIND_STRUCTURES), i => 
      i.structureType == "extractor");
    if (extractor == undefined) {
      return;
    }
    let mineraler = _.filter(room.find(FIND_MY_CREEPS), i=> 
      i.memory.role == "mineraler");
    if (mineraler.length < 1) {
      let mineral = room.find(FIND_MINERALS)[0];
      if (mineral == undefined || mineral.mineralAmount == 0) {
        return;
      }
      let newListPush = {
        role: "mineraler",
        bodys: this.returnBodys(room, "mineraler"),
      }
      SpawnCreep.newList.push(newListPush);
      return;
    }
    Mineraler.run(mineraler[0], room);
    return;
  },
  returnBodys: function (room: Room, role: string): BodyPartConstant[] {
    let energy = room.energyAvailable;
    let bodys = [WORK, WORK, CARRY, MOVE];
    if (role == "mineraler") {
      for (let i = 0; i < 10; ++i) {
        bodys[i] = WORK;
      }
      bodys.push(CARRY, MOVE, MOVE, MOVE, MOVE, MOVE);
      return bodys;
    }
    if (energy < 300) {
      bodys = [WORK, CARRY, MOVE, MOVE];
      return bodys;
    } else if (energy >= 800) {
      bodys = [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE];
      return bodys;
    }
    const consume = 300;
    let times = (energy - consume) / 250;
    for (let i = 1; i < times; ++i) {
      bodys.push(WORK, WORK, MOVE);
    }
    return bodys;
  },
}