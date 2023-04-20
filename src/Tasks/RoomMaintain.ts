import { CostCallBack } from "@/Path/CostCallBack";
import { Build } from "./Build";
import { Defend } from "./Defend";
import { Harvest } from "./Harvest";
import { Repair } from "./Repair"
import { SpawnCreep } from "./SpawnCreep";
import { Transfer } from "./Transfer";
import { Upgrade } from "./Upgrade";
declare var global: any;
export const RoomMaintain = {
  run: function () {
    for (let roomName in Game.rooms) {
      let room = Game.rooms[roomName];
      Harvest.run(room);
      if (Build.run(room) == 0) {
        Upgrade.run(room, 3);
      } else {
        Upgrade.run(room);
      }
      Repair.run(room);
      Transfer.run(room);
      Defend.run(room);
    }
  },
}