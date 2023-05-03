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
        {role: this.newList[i].role}});
    }
    this.newList = [];
    return;
  },
  recycle: function (room: Room): boolean {
    if (room.controller != undefined && room.controller.level >= 5) {
      return false;
    }
    let recycler = _.filter(room.find(FIND_MY_CREEPS), i =>
    i.memory.role == "recycler");
    if (recycler.length != 0) {
      let spawn = room.find(FIND_MY_SPAWNS).find(i => 
        recycler[0].pos.getRangeTo(i) == 1);
      if (spawn != undefined) {
        spawn.recycleCreep(recycler[0]);
      }
    }
    let storage = room.storage;
    if (storage != undefined) {
      let free = storage.store.getFreeCapacity() 
        / storage.store.getCapacity();
      if (free > 0.9) {
        return false;
      }
    }
    if (this.newList.length == 0) {
      let extensions:StructureExtension[] = _.filter(
        room.find(FIND_STRUCTURES), i => 
        i.structureType == "extension" );
      if (extensions.find(i => i.store.getFreeCapacity("energy") > 0)) {
        return false;
      }
      room.find(FIND_MY_SPAWNS)[0].spawnCreep([WORK, WORK, MOVE], 
        "recycler", {
        memory: {role: "recycler"},
        energyStructures: extensions as StructureExtension[],
        }
      );
      return true;
    }
    return false;
  },
}