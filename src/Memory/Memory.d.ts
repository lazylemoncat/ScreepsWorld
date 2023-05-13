interface Memory {
  harvester: Id<Creep>[]
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
interface SpawnMemory {
  /** 判断该 spawn 在当前 tick 下是否空闲 */
  spawnFree: number,
}