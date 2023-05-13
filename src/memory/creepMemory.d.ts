interface CreepMemory {
  /** creep 的角色 */
  role: string,
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