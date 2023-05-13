export const spawns = {
  /**
   * 判断第一个 spawn 是否空闲
   * @param room 
   * @returns {boolean} 第一个 spawn 是否空闲
   */
  isFreeFirstSpawn: function(room: Room): StructureSpawn | undefined {
    let spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn.spawning == null
      && Memory.spawns[spawn.name].spawnFree != Game.time
    ) {
      Memory.spawns[spawn.name].spawnFree = Game.time;
      return spawn;
    } else {
      return undefined;
    }
  },
};
/**
 * 返回该房间的空闲 spawn
 * @param room 判断的目标房间
 * @returns {StructureSpawn | undefined} 空闲的 spawn
 */
export const returnFreeSpawn = function(
    room: Room): StructureSpawn | undefined {
  let spawn = _.find(room.find(FIND_MY_SPAWNS), i => 
    i.spawning == null
    && Memory.spawns[i.name].spawnFree != Game.time
  );
  if (spawn == undefined) {
    return undefined;
  } else {
    Memory.spawns[spawn.name].spawnFree = Game.time;
    return spawn;
  }
}