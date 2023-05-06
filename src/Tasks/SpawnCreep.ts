export const SpawnCreep = {
  newList: [{}] as {
    role: string,
    bodys: BodyPartConstant[],
    opt?: string,
  }[],
  newCreep: function (room: Room) {
    let spawns = room.find(FIND_MY_SPAWNS);
    //if (this.recycle(room)) {
      //return;
    //}
    for (let i = 0; i < spawns.length; ++i) {
      if (i >= this.newList.length) {
        break;
      }
      if (this.newList[i].role == undefined) {
        continue;
      }
      let name = this.newList[i].role + Game.time;
      let role = this.newList[i].role;
      if (role == "harvester" || role == "worker") {
        name = (Game.time + this.newList[i].opt!) as string;
      }
      spawns[i].spawnCreep(this.newList[i].bodys, name, {memory: 
            { role: this.newList[i].role },
          directions: [TOP_LEFT , LEFT, BOTTOM_LEFT],
        }
      );
    }
    this.newList = [];
    return;
  },
}