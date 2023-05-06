import "./global/market";
import "./global/tasks";
import { MyMemory } from "./memory/myMemory";
import { outerSource } from "./tasks/outerSource";
import { RoomMaintain } from "./tasks/roomMaintain";
import { SpawnCreep } from "./tasks/spawnCreep";

/**
 * 每 tick 都执行的动作
 * @returns {void}
 */
export const loop = function () {
  // 运行市场的自动买卖
  global.Market.run();
  // 运行内存的管理
  MyMemory.run();
  // 运营每一个房间
  RoomMaintain.run();
  let room = Game.rooms["E41N49"]
  outerSource.run(room);
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