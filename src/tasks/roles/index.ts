import { Builder } from "./builder";
import { Carrier } from "./carrier";
import { Harvester } from "./harvester";
import { MineralCarrier } from "./mineralCarrier";
import { Mineraler } from "./mineraler";
import { Upgrader } from "./upgrader";
import { waller } from "./waller";

const creepRole = {
  ...Builder,
  ...Carrier,
  ...Harvester,
  ...MineralCarrier,
  ...Mineraler,
  ...Upgrader,
  ...waller,
}
/**
 * 导出所有角色
 */
export default creepRole;