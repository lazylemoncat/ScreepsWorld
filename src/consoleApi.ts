/**
 * 删除自己的所有订单以加快搜索速度
 * @returns {'OK'} 删除成功
 */
global.cancelAllOrder = function(): 'OK' {
  for (let i = 0; i < Object.keys(Game.market.orders).length; ++i) {
    Game.market.cancelOrder(Object.keys(Game.market.orders)[i] as string);
  }
  return 'OK';
};
/**
 * 设置外矿旗子
 * @param fromRoomName 外矿的返回房间名
 * @param toRoomName 目标外矿房间名
 * @returns 
 */
global.setOuterSource = function(
    fromRoomName: string,
    toRoomName: string): string {
  let name = 'outerSource' + Game.time % 10000;
  let pos = (new RoomPosition(25, 25, toRoomName));
  let res = pos.createFlag(name, COLOR_ORANGE, COLOR_YELLOW);
  if (res == ERR_INVALID_ARGS) {
    return 'ERR_INVALID_ARGS';
  }
  return 'OK';
};
/**
 * 移除目标外矿旗子
 * @param roomName 目标外矿房间名
 * @returns {string} 成功,或找不到旗子
 */
global.cancelOuterSource = function(roomName: string): string {
  let flag = _.find(Game.flags, i => 
    i.pos.roomName == roomName
    && i.name.includes('outerSource')
  );
  if (flag == undefined) {
    return 'CAN_NOT_FIND_FLAG';
  }
  flag.remove();
  return 'OK';
};
/**
 * 在控制台输出房间所有的 rampart 的平均血量
 * @param roomName 房间名
 * @returns 房间所有 rampart 的平均血量
 */
global.consoleAvgRampartHits = function(roomName: string): string {
  let room = Game.rooms[roomName];
  let ramparts = _.filter(room.find(FIND_STRUCTURES), i => 
    i.structureType == STRUCTURE_RAMPART
  ) as StructureRampart[];
  let sum = 0;
  for (let i = 0; i < ramparts.length; ++i) {
    sum += ramparts[i].hits;
  }
  let avgHits = Math.floor((sum / ramparts.length) / 1000);
  if (avgHits > 1000) {
    return avgHits / 1000 + 'M';
  }
  return avgHits + 'K';
};