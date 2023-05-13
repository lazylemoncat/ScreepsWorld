interface Memory {
  harvester: Id<Creep>[]
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
interface SpawnMemory {
  /** �жϸ� spawn �ڵ�ǰ tick ���Ƿ���� */
  spawnFree: number,
}