import { SpawnCreep } from "@/Tasks/SpawnCreep";

export const Scout = {
  run: function (roomName: string) {
    let room = Game.rooms[roomName];
    let scout = _.filter(Game.creeps, i => i.memory.role == "scout")[0];
    if (scout == undefined) {
      let newListPush = {
        role: "scout",
        bodys: this.returnBodys(room),
      };
      SpawnCreep.newList.push(newListPush);
      return;
    }
    if (scout.pos.roomName != roomName) {
      scout.moveTo(new RoomPosition(25, 20, roomName));
      return;
    }
    let controller = room.controller;
    if (controller == undefined) {
      return;
    }
    if (scout.signController(controller, 
      "i want to attack you, and please attack me too") == ERR_NOT_IN_RANGE) {
      scout.moveTo(controller);
    }
  },
  returnBodys: function (room: Room): BodyPartConstant[] {
    return [MOVE];
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