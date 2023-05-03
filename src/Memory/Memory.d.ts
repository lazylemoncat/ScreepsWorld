interface Memory {
  /** ����ʱ�ķ��䣬�ж��Ƿ�Ϊ���� */
  bornRoom: string,
  /** δ��ɵĶ��� */
  Market?: {
    buy: boolean,
    kind: MarketResourceConstant,
    amount: number,
    price?: number,
    room?: string
  },
}
interface CreepMemory {
  /** creep �Ľ�ɫ */
  role?: string,
  /** creep �Ƿ����������Ƿ����ڹ��� */
  working?: boolean,
  /** creep repair�����id */
  repairTarget?: Id<AnyStructure>,
  /** creep ���յ����� */
  task?: {
    type: "transfer" | "withdraw",
    target: Id<_HasId>,
    resource: ResourceConstant,
    amount?: number;
  },
  _move?: any;
  boosted?: boolean;
}