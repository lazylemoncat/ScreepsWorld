import { returnFreeSpawn, spawns } from "@/structures/spawns";
import { Withdraw } from "./withdraw";
import { MyMemory } from "@/memory/myMemory";

export const build = {
  run: function (room: Room): void {
    let sites = room.find(FIND_CONSTRUCTION_SITES);
    let builders = _.filter(Game.creeps, (creep) => creep.memory.role 
      == "builder");
    if (builders.length < 1 && sites.length != 0) {
      this.newBuilder(room);
    }
    for (let i = 0; i < builders.length; ++i) {
      this.runBuilder(builders[i], room);
    }
    return;
  },
  /**
   * 生产 builder
   * @param room 生产 creep 的房间
   */
  newBuilder: function (room: Room): void {
    let spawn = returnFreeSpawn(room);
    if (spawn == undefined) {
      return;
    }
    let result = spawn.spawnCreep(
      this.createBuilderBody(room),
      this.createBuilderName(room),
      {
        memory: { role: 'builder', bornRoom: room.name },
        directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
      },
    );
    return;
  },
  /**
   * 返回 builder 的名字
   * @param room 生产 creep 的房间
   * @returns {string} builder 的名字
   */
  createBuilderName: function (room: Room): string {
    return 'builder' + room.name;
  },
  /**
   * 返回 builder 的身体部件数组
   * @param room 生产 builder 的房间
   * @returns {BodyPartConstant[]} builder 的身体部件数组
   */
  createBuilderBody: function (room: Room): BodyPartConstant[] {
    let energy = room.energyAvailable;
    let bodys = [WORK, CARRY, MOVE];
    const consume = 200;
    let times = Math.floor((energy - consume) / consume);
    for (let i = 0; i < times; ++i) {
      bodys.push(WORK, CARRY, MOVE);
    }
    return bodys;
  },
  /**
   * builder 执行 建造任务
   * @param creep builder 对象
   * @param room 执行任务的房间
   */
  runBuilder: function (creep: Creep, room: Room): void {
    if (MyMemory.upateWorking(creep, "energy")) {
      let sites = room.find(FIND_CONSTRUCTION_SITES);
      if (sites.length == 0) {
        creep.memory.role = 'waller';
        return;
      }
      if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(sites[0]);
      }
    } else {
      Withdraw.energy(creep, room);
    }
    return;
  },
  /**
   * 当没有工地时，自动回去找到 spawn 执行 recycle
   * @param creep builder 对象
   * @param room 执行 recycle 的房间
   */
  goRecycle: function (creep: Creep, room: Room): void {
    let spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn.recycleCreep(creep) == ERR_NOT_IN_RANGE) {
      creep.moveTo(spawn);
    }
    return;
  },
}