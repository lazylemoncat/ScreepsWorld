import { Tower } from "./Structures/Tower";

export const Defend = {
  run: function (room: Room) {
    let enemy = room.find(FIND_HOSTILE_CREEPS);
    if (enemy[0] == undefined) {
      return;
    }
    if (enemy.find(i => i.owner.username == "PacifistBot") != undefined) {
      let controller = room.controller!;
      controller.activateSafeMode();
      Game.notify("SF ON");
    }
    Tower.defend(room);
  }
}