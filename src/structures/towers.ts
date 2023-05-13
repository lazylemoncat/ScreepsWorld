export const towers = function(room: Room) {
  const run = function () {
    let towers = _.filter(room.find(FIND_STRUCTURES), (i) =>
      i.structureType == "tower") as StructureTower[];
    if (attack(towers)) {
      return;;
    }
    for (let i = 0; i < towers.length; ++i) {
      if (!heal(towers[i])) {
        repair(towers[i], i);
      }
    }
    return;
  };
  const attack = function (towers: StructureTower[]): boolean {
    let enemy = room.find(FIND_HOSTILE_CREEPS);
    if (enemy[0] == undefined) {
      return false;
    }
    for (let i = 0; i < towers.length; ++i) {
      towers[i].attack(enemy[0]);
    }
    return true;
  };
  const heal = function(tower: StructureTower): boolean {
    let creep = _.find(room.find(FIND_MY_CREEPS), i => 
      i.hits < i.hitsMax
    );
    if (creep == undefined) {
      return false;
    }
    tower.heal(creep);
    return true;
  };
  const repair = function (tower: StructureTower, index: number): void {
    let targets = _.filter(room.find(FIND_STRUCTURES), i => 
      i.hits < i.hitsMax 
      && i.structureType != STRUCTURE_WALL
      && i.structureType != STRUCTURE_RAMPART
      || (i.structureType == STRUCTURE_RAMPART && i.hits < 1000)
    );
    targets.sort((a,b) => a.hits - b.hits);
    tower.repair(targets[index]);
    return;
  };
  run();
}