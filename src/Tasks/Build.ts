import { Builder } from "./roles/builder";
import { SpawnCreep } from "./spawnCreep";

export const Build = {
  run: function (room: Room) {
    let sites = room.find(FIND_CONSTRUCTION_SITES);
    let builders = _.filter(Game.creeps, (creep) => creep.memory.role 
      == "builder");
    if (sites.length == 0) {
      for (let i = 0; i < builders.length; ++i) {
        Builder.goRecycle(builders[i], room);
      }
      return 0;
    }
    if (builders.length < 1) {
      let newListPush = {
        role: "builder",
        bodys: this.returnBodys(room),
      };
      SpawnCreep.newList.push(newListPush);
    }
    if (builders.length == 0) {
      return;
    }
    for (let i = 0; i < builders.length; ++i) {
      Builder.run(builders[i], room);
    }
    return;
  },
  returnBodys: function (room: Room): BodyPartConstant[] {
    let energy = room.energyAvailable;
    let bodys = [WORK, CARRY, MOVE];
    const consume = 200;
    let times = (energy - consume) / consume;
    for (let i = 1; i < times; ++i) {
      bodys.push(WORK, CARRY, MOVE);
    }
    return bodys;
  }
}