export const Spawns = {
  /**
   * 判断该房间是否有空闲的 spawn
   * @param room 
   * @returns 
   */
  isFreeSpawn: function (room: Room): boolean {
    let spawn = _.find(room.find(FIND_MY_SPAWNS), i => 
      i.spawning == null);
    if (spawn == undefined) {
      return false;
    } else {
      return true;
    }
  },
}