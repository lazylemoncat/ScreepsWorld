export const Tower = {
  repair: function (target: AnyStructure, room: Room) {
    let towers = _.filter(room.find(FIND_STRUCTURES), (i) =>
      i.structureType == "tower") as StructureTower[];
    let enemy = room.find(FIND_HOSTILE_CREEPS);
    if (enemy[0] != undefined) {
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
    for (let i = 0; i < towers.length; ++i) {
      let tower = towers[i];
      tower.attack(enemy[0]);
    }
    return;
  },
}