import { SpawnCreep } from "./SpawnCreep";

export const Transfer = {
  run: function (room: Room) {
    let carriers = _.filter(Game.creeps, (creep) => creep.memory.role 
      == "carrier");
    if (carriers.length < 2) {
      let container = _.filter(room.find(FIND_STRUCTURES), (i) => 
        i.structureType == "container");
      if (container[0] == undefined) {
        return;
      }
      let newListPush = {
        role: "carrier",
        bodys: this.returnBodys(room),
      }
      SpawnCreep.newList.push(newListPush);
    }
    if (carriers.length == 0) {
      return;
    }
  },
  returnBodys: function (room: Room): BodyPartConstant[] {
    let energy = room.energyAvailable;
    let bodys = [CARRY, MOVE] as BodyPartConstant[];
    const consume = 100;
    let times = (energy - consume) / 100;
    for (let i = 1; i < times; ++i) {
      bodys.push(CARRY, MOVE);
    }
    return bodys;
  },
}