import { Build } from "./build";
import { Defend } from "./defend";
import { FastUpgrade } from "./fastUpgrade";
import { Harvest } from "./harvest";
import { Labs } from "../structures/labs"
import { Transfer } from "./transfer";
import { Upgrade } from "./upgrade";
import { RoomVisual } from "@/visual/roomVisual";
import { Repair } from "./repair";
import { centerTransferer } from "./centerTransferer";

export const RoomMaintain = {
  run: function () {
    for (let roomName in Game.rooms) {
      let room = Game.rooms[roomName];
      if (room.controller == undefined || !room.controller.my) {
        continue;
      }
      let level = 0;
      if (room.controller != undefined) {
        level = room.controller.level;
      }
      if (level < 3) {
        FastUpgrade.run(room);
        Defend.run(room);
        return;
      }
      RoomVisual.run(roomName);
      let costs = this.roomCallBack(room);
      Harvest.run(room);
      centerTransferer.run(room);
      Transfer.run(room, costs);
      if (Build.run(room) == 0) {
        Upgrade.run(room, 1);
      } else {
        Upgrade.run(room);
      }
      Repair.run(room)
      Labs.runReaction(room);
      Defend.run(room);
    }
  },
  roomCallBack: function (room: Room): CostMatrix {
    let costs = new PathFinder .CostMatrix;
    room.find(FIND_STRUCTURES).forEach(struct => {
      if (struct.structureType === STRUCTURE_ROAD) {
        // road 成本设置为1
        costs .set(struct.pos.x, struct.pos.y, 1);
      } else if (struct.structureType !== STRUCTURE_CONTAINER
        && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {
        // 除 container 和 rampart 外所有建筑或不是自己的建筑成本设置为255
        costs.set(struct.pos .x, struct.pos.y, 255)
      }
    });
    room.find(FIND_MY_CONSTRUCTION_SITES).forEach(cons => {
      if (cons.structureType !== 'road' 
        && cons.structureType !=='rampart' 
        && cons.structureType !== "container") {
        costs.set(cons.pos.x, cons.pos.y, 255);
      }
    });
    room.find(FIND_HOSTILE_CREEPS).forEach(creep => {
      costs.set(creep.pos.x, creep.pos.y, 255);
    });
    room.find(FIND_MY_CREEPS).forEach(creep => {
      if (creep.memory.role == "harvester") {
        costs.set(creep.pos.x, creep.pos.y, 255);
      }
    });
    return costs;
  },
}