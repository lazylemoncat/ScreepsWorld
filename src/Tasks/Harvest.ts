import { Harvester } from "./Roles/Harvester";
import { SpawnCreep } from "./SpawnCreep";

export const Harvest = {
  run: function (room: Room) {
    let sources = room.find(FIND_SOURCES);
    let harvesters = _.filter(room.find(FIND_MY_CREEPS), (creep) => 
      creep.memory.role == "harvester");
    if (harvesters.length < sources.length) {
      let newListPush = {
        role: "harvester",
        bodys: this.returnBodys(room),
      }
      SpawnCreep.newList.push(newListPush);
    }
    if (harvesters.length == 0) {
      return;
    } 
    for (let i = 0; i < sources.length; ++i) {
      let source = sources[i];
      if (harvesters[i] == undefined) {
        break;
      }
      Harvester.run(source, room, harvesters[i]);
    }
  },
  returnBodys: function (room: Room): BodyPartConstant[] {
    let energy = room.energyAvailable;
    let bodys = [WORK, WORK, CARRY, MOVE];
    if (energy < 300) {
      bodys = [WORK, CARRY, MOVE, MOVE];
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