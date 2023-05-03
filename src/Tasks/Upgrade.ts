import { Upgrader } from "./Roles/Upgrader";
import { SpawnCreep } from "./SpawnCreep";

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
    let bodys = [WORK, WORK, CARRY, MOVE];
    if (energy <= 300) {
      bodys = [WORK, CARRY, MOVE];
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