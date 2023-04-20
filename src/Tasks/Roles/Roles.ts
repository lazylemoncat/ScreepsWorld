import { Harvester } from "./Harvester"
import { Upgrader } from "./Upgrader";
import { Carrier } from "./Carrier";
import { Repairer } from "./Repairer";

export const Roles = {
  run: function (room: Room) {
    // Upgrader.run(room);
    Carrier.run(room);
    Repairer.run(room);
  }
}