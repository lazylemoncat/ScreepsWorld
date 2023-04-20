import { Market } from "./Market/Market";
import { MyMemory } from "./Memory/MyMemory";
import { Roles } from "./Tasks/Roles/Roles";
import { RoomMaintain } from "./Tasks/RoomMaintain";
import { SpawnCreep } from "./Tasks/SpawnCreep";

import "./global/gloal";

export const loop = function () {
  // 运行市场的买卖
  Market.run();
  // 运行内存的管理
  MyMemory.run();
  // 运营每一个房间
  RoomMaintain.run();
  for (let roomName in Game.rooms) {
    let room = Game.rooms[roomName];
    SpawnCreep.newCreep(room);
    Roles.run(room);
  }
  return;
}