import { Builder } from "./Roles/Builder";
import { SpawnCreep } from "./SpawnCreep";

export const Build = {
  run: function (room: Room) {
    let sites = room.find(FIND_CONSTRUCTION_SITES);
    if (sites.length == 0) {
      return 0;
    }
    let builders = _.filter(Game.creeps, (creep) => creep.memory.role 
      == "builder");
    if (builders.length < 2) {
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
      Builder.run(sites[0], builders[i], room);
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