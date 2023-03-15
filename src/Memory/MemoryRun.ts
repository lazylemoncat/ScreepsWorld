export const MemoryRun = {
  run: function(): void {
    if (Memory.bornRoom == undefined || !(Memory.bornRoom in Game.rooms)) {
      this.reset();
    }
    if (Memory.creepsNum < Object.getOwnPropertyNames(Memory.creeps).length) {
      this.deleteCreep();
      Memory.creepsNum = Object.getOwnPropertyNames(Memory.creeps).length;
    }
  },

  reset: function(): void {
    if (Memory.bornRoom in Game.rooms) {
      return;
    }
    Memory.creepsNum = 0;
    Memory.rooms = {};
    Memory.spawns = {};
    Memory.creeps = {};
    Memory.bornRoom = Game.spawns.Spawn1.room.name;
  },

  deleteCreep: function(): void {
    for(let name in Memory.creeps) {
      if(!Game.creeps[name]) {
        let role = Memory.creeps[name].role;
        let roomName = Memory.creeps[name].room;
        let index = (Memory.rooms[roomName] as any)[role+'s'].indexOf(name);
        (Memory.rooms[roomName] as any)[role+'s'].splice(index, 1);
        delete Memory.creeps[name];
      }
    }
    return;
  },

}