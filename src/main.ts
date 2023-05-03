import "./Global/Market";
import "./Global/Tasks";
import { MyMemory } from "./Memory/MyMemory";
import { RoomMaintain } from "./Tasks/RoomMaintain";
import { SpawnCreep } from "./Tasks/SpawnCreep";

export const loop = function () {
  // 运行市场的自动买卖
  global.Market.run();
  // 运行内存的管理
  MyMemory.run();
  // 运营每一个房间
  RoomMaintain.run();
  for (let roomName in Game.rooms) {
    let room = Game.rooms[roomName];
    if (room.controller == undefined ||  room.controller.my == false) {
      continue;
    }
    // 生产 creep
    SpawnCreep.newCreep(room);
  }
  return;
}