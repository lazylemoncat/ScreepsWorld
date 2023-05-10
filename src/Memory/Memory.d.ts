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
  /** ����ܵ�����ʱ��ʱ�� */
  delayHarvest?: {[room: string]: number},
  /** ��ɫ�ӳ�������ʱ�� */
  delayTime?: {
    [role: string]: {
      time: number, 
      delay: number, 
    }
  },
}
interface CreepMemory {
  /** creep �Ľ�ɫ */
  role?: string,
  /** creep �����ķ��� */
  bornRoom: string,
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
  /** source �� ID ������ */
  source?: {id: Id<Source>, pos: RoomPosition},
  /** ����Ӧ�ķ��� */
  outerRoom?: string,
  /** flag �����ֺ����� */
  flag?: {name: string, pos: RoomPosition},
  /** ����Ŀ���ID */
  attackTarget?: Id<Creep | Structure>,
  _move?: any;
  boosted?: boolean;
}
interface SpawnMemory {
  /** �жϸ� spawn �ڵ�ǰ tick ���Ƿ���� */
  spawnFree: number,
}