import { returnFreeSpawn } from "@/structures/spawns";
import { Withdraw } from "./withdraw";

export const repair = function(room: Room) {
  const run = function () {
    let wallers = _.filter(room.find(FIND_MY_CREEPS), i => 
      i.memory.role == 'waller'
      && i.memory.bornRoom == room.name
    );
    if (wallers.length < 3) {
      newWaller();
    }
    for (let i = 0; i < wallers.length; ++i) {
      runWaller(wallers[i]);
    }
    return;
  };
  const createWallerName = function() {
    return 'waller' + room.name + '_' + Game.time % 10;
  };
  const createWallerBody = function(): BodyPartConstant[] {
    let energy = room.energyAvailable;
    let bodys: BodyPartConstant[] = [];
    const consume = 200;
    let times = Math.floor(energy / consume);
    for (let i = 0; i < times; ++i) {
      bodys.push(WORK, CARRY, MOVE);
    }
    return bodys;
  };
  const newWaller = function() {
    let spawn = returnFreeSpawn(room);
    if (spawn == undefined) {
      return;
    }
    let name = createWallerName();
    let body = createWallerBody();
    let result = spawn.spawnCreep(body, name,{
        memory: { role: 'waller', bornRoom: room.name },
        directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
      },
    );
    return;
  };
  const runWaller = function(creep: Creep) {
    if (creep.store[RESOURCE_ENERGY] == 0) {
      Withdraw.energy(creep, room);
      return;
    }
    if (creep.memory.repairTarget != undefined) {
      let target = Game.getObjectById(creep.memory.repairTarget);
      if (target == undefined) {
        creep.memory.repairTarget = undefined;
      } else if (target.hits == target.hitsMax) {
        creep.memory.repairTarget = undefined;
      } else {
        if (creep.repair(target) == ERR_NOT_IN_RANGE) {
          creep.moveTo(target);
        }
        return;
      }
    }
    let structures = room.find(FIND_STRUCTURES).filter(
        i => i.structureType == "rampart");
    let targets = structures.filter(i => i.hits < i.hitsMax);
    targets.sort((a,b) => a.hits - b.hits);
    if (targets[0] == undefined) {
      return;
    }
    creep.memory.repairTarget = targets[0].id;
    if (creep.repair(targets[0]) == ERR_NOT_IN_RANGE) {
      creep.moveTo(targets[0]);
    }
    return;
  };
  run();
}