import { SpawnCreep } from "@/Tasks/SpawnCreep";

export const AIO = {
  attack: function (roomName: string) {
    let room = Game.rooms[roomName];
    let AIO = _.filter(Game.creeps, i => i.memory.role == "AIO")[0];
    if (AIO == undefined) {
      this.newCreep("E28N56");
      return;
    }
    AIO.heal(AIO);
    if (AIO.pos.roomName == "E28N56" && !AIO.memory.boosted) {
      this.boostCreep(AIO, "E28N56");
      return;
    }
    if (AIO.pos.roomName != roomName) {
      AIO.moveTo(new RoomPosition(25, 20, roomName));
      return;
    }
    let hostiles = room.find(FIND_HOSTILE_CREEPS);
    let hostile = AIO.pos.findClosestByPath(hostiles);
    if (hostile != null) {
      if (hostile.body.find(i => i.type == "attack" 
        || i.type == "ranged_attack") != undefined) {
        if (AIO.rangedAttack(hostile) == OK) {
          let path = PathFinder.search(AIO.pos, hostile.pos, {
            flee: true,
          });
          let pos = path.path[0];
          AIO.move(AIO.pos.getDirectionTo(pos));
          return;
        }
      }
      AIO.moveTo(hostile);
      AIO.rangedAttack(hostile);
      return;
    }
    let structures = room.find(FIND_HOSTILE_STRUCTURES);
    let structure = AIO.pos.findClosestByPath(structures);
    if (structure != null) {
      AIO.moveTo(structure);
      AIO.rangedAttack(structure);
      return;
    }
    if (room.controller != undefined && !room.controller.my) {
      let controller = room.controller;
      if (controller.sign?.username == "LazyKitty") {
        return;
      }
      if (AIO.signController(controller, 
      "i want to attack you, and please attack me too") == ERR_NOT_IN_RANGE) {
        AIO.moveTo(controller);
      }
    }
    return;
  },
  newCreep: function (roomName: string) {
    let room = Game.rooms[roomName];
    let newListPush = {
      role: "AIO",
      bodys: this.returnBodys(room),
    };
    SpawnCreep.newList.push(newListPush);
    return;
  },
  returnBodys: function (room: Room): BodyPartConstant[] {
    let energy = room.energyCapacityAvailable;
    let bodys = [RANGED_ATTACK, HEAL, MOVE, MOVE];
    const consume = 500;
    let times = (energy - consume) / consume;
    for (let i = 1; i < times; ++i) {
      bodys.push(RANGED_ATTACK, HEAL, MOVE, MOVE);
    }
    return bodys;
  },
  boostCreep: function (creep: Creep, roomName: string) {
    if (creep.memory.boosted) {
      return;
    }
    let room = Game.rooms[roomName];
    let bodys = creep.body.filter(i => i.type == "heal" && i.boost != "LO");
    if (bodys.length != 0) {
      let lab = _.find(room.find(FIND_STRUCTURES), i =>
        i.structureType == "lab" && i.store["LO"] > 100) as StructureLab;
      if (lab != undefined) {
        if (lab.boostCreep(creep, bodys.length) != OK) {
          creep.moveTo(lab);
          return;
        }
        creep.memory.boosted = true;
      }
    }
  },
}