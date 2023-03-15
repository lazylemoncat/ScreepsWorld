export const tower = {
  repair: function(room: Room): void {
    let structures = room.find(FIND_STRUCTURES);
    let injureds = structures.filter(i => i.hits < i.hitsMax);
    injureds.sort((a,b) => a.hits - b.hits);
    let targets = injureds.filter(i => i.structureType != STRUCTURE_WALL && i.structureType != STRUCTURE_RAMPART);
    if (targets[0] == undefined) {
      targets = injureds;
    }
    for (let i = 0; i < room.memory.towers.length; ++i) {
      let tower = Game.getObjectById(room.memory.towers[i]);
      if (tower == null) {
        continue;
      }
      tower.repair(targets[0]);
    }
    return;
  }
}