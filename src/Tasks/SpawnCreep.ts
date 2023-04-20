export const SpawnCreep = {
  newList: [{}] as {
    role: string,
    bodys: BodyPartConstant[],
  }[],
  newCreep: function (room: Room) {
    let spawns = room.find(FIND_MY_SPAWNS);
    for (let i = 0; i < spawns.length; ++i) {
      if (i >= this.newList.length) {
        break;
      }
      if (this.newList[i].role == undefined) {
        continue;
      }
      let name = this.newList[i].role + Game.time;
      spawns[i].spawnCreep(this.newList[i].bodys, name, {memory: 
        {role: this.newList[i].role}});
    }
    this.newList = [];
    return;
  },
}