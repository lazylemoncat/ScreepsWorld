interface Memory {
  /** 出生时的房间，判断是否为重生 */
  bornRoom: string,
  /** 未完成的订单 */
  Market?: {
    buy: boolean,
    kind: MarketResourceConstant,
    amount: number,
    price?: number,
    room?: string
  },
  /** 外矿受到攻击时的时间 */
  delayHarvest?: {[room: string]: number},
  /** 角色延迟生产的时间 */
  delayTime?: {
    [role: string]: {
      time: number, 
      delay: number, 
    }
  },
}
interface CreepMemory {
  /** creep 的角色 */
  role?: string,
  /** creep 出生的房间 */
  bornRoom: string,
  /** creep 是否有能量或是否正在工作 */
  working?: boolean,
  /** creep repair对象的id */
  repairTarget?: Id<AnyStructure>,
  /** creep 接收的任务 */
  task?: {
    type: "transfer" | "withdraw",
    target: Id<_HasId>,
    resource: ResourceConstant,
    amount?: number;
  },
  /** source 的 ID 和坐标 */
  source?: {id: Id<Source>, pos: RoomPosition},
  /** 外矿对应的房间 */
  outerRoom?: string,
  /** flag 的名字和坐标 */
  flag?: {name: string, pos: RoomPosition},
  /** 攻击目标的ID */
  attackTarget?: Id<Creep | Structure>,
  _move?: any;
  boosted?: boolean;
}
interface SpawnMemory {
  /** 判断该 spawn 在当前 tick 下是否空闲 */
  spawnFree: number,
}