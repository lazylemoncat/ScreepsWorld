import { Upgrader } from "./roles/upgrader";
import { SpawnCreep } from "./spawnCreep";

export const Upgrade = {
  run: function (room: Room, upgradersNum?: number) {
    let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role 
      == "upgrader" && creep.pos.roomName == room.name);
    if (upgradersNum == undefined) {
      upgradersNum = 1;
    }
    if (upgraders.length < upgradersNum) {
      let newListPush = {
        role: "upgrader",
        bodys: this.returnBodys(room),
      };
      SpawnCreep.newList.push(newListPush);
    }
    if (upgraders.length == 0) {
      return;
    }
    for (let i = 0; i < upgraders.length; ++i) {
      Upgrader.run(upgraders[i], room);
    }
    return;
  },
  returnBodys: function (room: Room) {
    let energy = room.energyCapacityAvailable;
    let bodys = [WORK, CARRY, MOVE];
    if (energy <= 300) {
      return bodys;
    }
    const consume = 200;
    let times = Math.floor((energy - consume) / 250);
    for (let i = 0; i < times; ++i) {
      bodys.push(WORK, WORK, MOVE);
    }
    return bodys;
  },
}