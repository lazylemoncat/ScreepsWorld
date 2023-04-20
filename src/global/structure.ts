declare var global: any;
global.structure = function (kind: string) {
  if (kind == "repair") {
    for (let roomName in Game.rooms) {
      console.log(roomName);
      console.log("............................................");
      let room = Game.rooms[roomName];
      let structures = room.find(FIND_STRUCTURES).filter(
        i => i.structureType != STRUCTURE_WALL);
      let targets = structures.filter(i => i.hits < i.hitsMax);
        targets.sort((a,b) => a.hits - b.hits);
      for (let i = 0; i < targets.length; ++i) {
        let target = targets[i];
        console.log(target.structureType, target.hits + '/' + target.hitsMax);
      }
    }
    return;
  }
}