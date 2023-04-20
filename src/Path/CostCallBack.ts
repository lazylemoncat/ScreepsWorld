export const CostCallBack = function (roomName: string, 
  costMatrix: CostMatrix) {
  let room = Game.rooms[roomName]; // 对于给定的房间名称，获取房间对象
  // 在房间中循环遍历所有的建筑物
  room.find(FIND_STRUCTURES).forEach(function(structure) {
    if (structure.structureType === STRUCTURE_ROAD) {
      // 如果建筑是道路，将其成本设置为1
      costMatrix.set(structure.pos.x, structure.pos.y, 0);
    }
  });
  return costMatrix; // 返回成本矩阵
}