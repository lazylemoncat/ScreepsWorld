import { SpawnCreep } from "@/Tasks/SpawnCreep";

export const Attacker = {
  attack: function (roomName: string) {
    let room = Game.rooms[roomName];
    let attacker = _.filter(Game.creeps, i => i.memory.role == "attacker")[0];
    if (attacker == undefined) {
      this.newCreep("E28N56");
      return;
    }
    if (attacker.pos.roomName != roomName) {
      attacker.moveTo(new RoomPosition(25, 20, roomName));
      return;
    }
    let hostiles = room.find(FIND_HOSTILE_CREEPS);
    let hostile = attacker.pos.findClosestByPath(hostiles);
    if (hostile != null) {
      attacker.moveTo(hostile);
      attacker.attack(hostile);
      return;
    }
    let structures = room.find(FIND_HOSTILE_STRUCTURES);
    let structure = attacker.pos.findClosestByPath(structures);
    if (structure != null) {
      attacker.moveTo(structure);
      attacker.attack(structure);
      return;
    }
    if (room.controller != undefined && !room.controller.my) {
      let controller = room.controller;
      if (controller.sign?.username == "LazyKitty") {
        return;
      }
      if (attacker.signController(controller, 
      "i want to attack you, and please attack me too") == ERR_NOT_IN_RANGE) {
        attacker.moveTo(controller);
      }
    }
    return;
  },
  newCreep: function (roomName: string) {
    let room = Game.rooms[roomName];
    let newListPush = {
      role: "attacker",
      bodys: this.returnBodys(room),
    };
    SpawnCreep.newList.push(newListPush);
    return;
  },
  returnBodys: function (room: Room): BodyPartConstant[] {
    let energy = room.energyCapacityAvailable;
    let bodys = [ATTACK, MOVE];
    const consume = 130;
    let times = (energy - consume) / consume;
    for (let i = 1; i < times; ++i) {
      bodys.push(ATTACK, MOVE);
    }
    return bodys;
  },
}