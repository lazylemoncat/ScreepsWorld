import { Tower } from "./Structures/Tower";

export const Defend = {
  run: function (room: Room) {
    let enemy = room.find(FIND_HOSTILE_CREEPS);
    if (enemy[0] == undefined) {
      return;
    }
    Tower.defend(room);
  }
}