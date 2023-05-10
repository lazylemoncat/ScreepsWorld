import { towers } from "../structures/towers";

export const Defend = {
  run: function (room: Room) {
    let enemy = room.find(FIND_HOSTILE_CREEPS);
    if (enemy[0] == undefined) {
      return;
    }
    let PBCreep = enemy.find(i => 
      i.owner.username == "PacifistBot"
      && i.body.find(i => i.type == ATTACK || i.type == RANGED_ATTACK)   
    )
    if (PBCreep != undefined) {
      let controller = room.controller!;
      controller.activateSafeMode();
      Game.notify("SF ON");
    }
    towers.defend(room);
  }
}