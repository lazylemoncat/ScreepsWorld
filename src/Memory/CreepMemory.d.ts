interface CreepMemory {
  /*** creep 的角色 */
  role?: string,
  /***  creep 是否有能量或是否正在工作 */
  working?: boolean,
  /***  creep repair对象的id*/
  repairTarget?: Id<AnyStructure>,
}