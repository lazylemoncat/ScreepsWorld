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
}
interface CreepMemory {
  /** creep 的角色 */
  role?: string,
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
  _move?: any;
  boosted?: boolean;
}