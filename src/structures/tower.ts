export const Tower = {
  repair: function (target: AnyStructure, room: Room) {
    let towers = _.filter(room.find(FIND_STRUCTURES), (i) =>
      i.structureType == "tower") as StructureTower[];
    let enemy = room.find(FIND_HOSTILE_CREEPS);
    if (enemy[0] != undefined) {
      return;
    }
    let rampart = _.filter(room.find(FIND_STRUCTURES), i =>
        i.structureType == "rampart" && i.hits < 1000) as StructureRampart[];
    if (rampart.length != 0) {
      let tower = towers[0];
      tower.repair(target);
      return;
    }
    for (let i = 0; i < towers.length; ++i) {
      let tower = towers[i];
      tower.repair(target);
    }
    return;
  },
  defend: function (room: Room) {
    let towers = _.filter(room.find(FIND_STRUCTURES), (i) =>
      i.structureType == "tower") as StructureTower[];
    let enemy = room.find(FIND_HOSTILE_CREEPS);
    if (enemy[0] == undefined) {
      return;
    }
    enemy = _.filter(enemy, i => i.pos.findInRange(FIND_EXIT, 2).length == 0);
    if (enemy[0] == undefined) {
      return;
    }
    for (let i = 0; i < towers.length; ++i) {
      let tower = towers[i];
      tower.attack(enemy[0]);
    }
    return;
  },
}