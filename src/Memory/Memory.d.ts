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
  /** ����ܵ�������,�ӳٲɼ���ʱ�� */
  delayHarvest?: {room: string, time: number},
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
  /** source �� ID */
  sourceId?: Id<Source>,
  /** ����Ӧ�ķ��� */
  outerRoom?: string,
  _move?: any;
  boosted?: boolean;
}