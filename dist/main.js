'use strict';

global.Market = {
    run: function () {
        // 当有未完成的购买订单时，继续购买
        if (Memory.Market != undefined) {
            if (Memory.Market.buy == true) {
                let order = Memory.Market;
                this.buy(order.kind, order.amount, order.room);
            }
        }
        // 获得像素
        this.getPixel();
        return;
    },
    buy: function (kind, amount, room) {
        let orders = Game.market.getAllOrders({
            type: "sell",
            resourceType: kind,
        });
        // 价格从低到高排列
        orders.sort((a, b) => a.price - b.price);
        if (orders[0] == undefined) {
            return "ORDERS_NOT_EXIST";
        }
        for (let i = 0; amount > 0 && i <= 10; ++i) {
            // 当执行订单达到该 tick 的限制时，将任务存入内存延缓执行
            if (i == 10) {
                if (room == undefined) {
                    Memory.Market = {
                        buy: true,
                        kind: kind,
                        amount: amount,
                    };
                    return "WILL_BE_SOON";
                }
                Memory.Market = {
                    buy: true,
                    kind: kind,
                    amount: amount,
                    room: room
                };
                return "WILL_BE_SOON";
            }
            let dealAmount = amount - orders[i].amount > 0
                ? orders[i].amount : amount;
            let res = 0;
            if (room == undefined) {
                res = Game.market.deal(orders[i].id, dealAmount);
            }
            else {
                res = Game.market.deal(orders[i].id, dealAmount, room);
            }
            if (res != 0) {
                return "ERR" + res;
            }
            amount -= dealAmount;
        }
        Memory.Market = undefined;
        return "DEAL";
    },
    sell: function (kind, amount, room) {
        let orders = Game.market.getAllOrders({
            type: "buy",
            resourceType: kind,
        });
        // 价格从高到低排列
        orders.sort((a, b) => b.price - a.price);
        if (orders[0] == undefined) {
            return "ORDERS_NOT_EXIST";
        }
        for (let i = 0; amount > 0 && i <= 10; ++i) {
            // 当执行订单达到该 tick 的限制时，将任务存入内存延缓执行
            if (i == 10) {
                if (room == undefined) {
                    Memory.Market = {
                        buy: false,
                        kind: kind,
                        amount: amount,
                    };
                    return "WILL_BE_SOON";
                }
                Memory.Market = {
                    buy: false,
                    kind: kind,
                    amount: amount,
                    room: room
                };
                return "WILL_BE_SOON";
            }
            let dealAmount = amount - orders[i].amount > 0
                ? orders[i].amount : amount;
            let res = 0;
            if (room == undefined) {
                res = Game.market.deal(orders[i].id, dealAmount);
            }
            else {
                res = Game.market.deal(orders[i].id, dealAmount, room);
            }
            if (res != 0) {
                return "ERR" + res;
            }
            amount -= dealAmount;
        }
        Memory.Market = undefined;
        return "DEAL";
    },
    createOrder: function (type, kind, price, totalAmount, room) {
        let res = Game.market.createOrder({
            type: type,
            resourceType: kind,
            price: price,
            totalAmount: totalAmount,
            roomName: room
        });
        if (res != 0) {
            return "ERR" + res;
        }
        return "OK";
    },
    send: function (roomName, kind, amount, toRoom) {
        let room = Game.rooms[roomName];
        if (room.terminal == undefined) {
            return "TERMINAL_NOT_EXIST";
        }
        let res = room.terminal.send(kind, amount, toRoom);
        if (res != 0) {
            return "ERR" + res;
        }
        return "OK";
    },
    getPixel() {
        if (Game.cpu.bucket == 10000 && Game.cpu.generatePixel) {
            Game.cpu.generatePixel();
        }
        return;
    },
};

const MyMemory = {
    run: function () {
        this.reset();
        this.deleteDead();
        return;
    },
    /**
     *  删除 memory 中不存在的creep
     */
    deleteDead: function () {
        for (let name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
        return;
    },
    /**
     * 判断creep能量够不够，更新memory中working状态
     * @param creep
     * @param resource
     * @returns true | false
     */
    upateWorking: function (creep, resource) {
        let resouceType = Object.keys(creep.store)[0];
        if (resouceType == undefined) {
            resouceType = "energy";
        }
        if (creep.memory.working && creep.store[resouceType] == 0) {
            creep.memory.working = false;
            return false;
        }
        else if (!creep.memory.working
            && creep.store.getFreeCapacity('energy') == 0) {
            creep.memory.working = true;
            return true;
        }
        if (creep.memory.working) {
            return true;
        }
        else {
            return false;
        }
    },
    reset: function () {
        if (Memory.bornRoom in Game.rooms) {
            return;
        }
        Memory.bornRoom = Game.spawns["Spawn1"].room.name;
        Memory.delayHarvest = {};
        Memory.spawns = {};
    },
};

const spawns = {
    /**
     * 判断第一个 spawn 是否空闲
     * @param room
     * @returns {boolean} 第一个 spawn 是否空闲
     */
    isFreeFirstSpawn: function (room, role) {
        let spawn = room.find(FIND_MY_SPAWNS)[0];
        if (spawn.spawning == null
            && Memory.spawns[spawn.name].spawnFree != Game.time) {
            Memory.spawns[spawn.name].spawnFree = Game.time;
            return spawn;
        }
        else {
            return undefined;
        }
    },
};
/**
 * 返回该房间的空闲 spawn
 * @param room 判断的目标房间
 * @returns {StructureSpawn | undefined} 空闲的 spawn
 */
const returnFreeSpawn = function (room) {
    let spawn = _.find(room.find(FIND_MY_SPAWNS), i => i.spawning == null
        && Memory.spawns[i.name].spawnFree != Game.time);
    if (spawn == undefined) {
        return undefined;
    }
    else {
        Memory.spawns[spawn.name].spawnFree = Game.time;
        return spawn;
    }
};

const outerSource = function (context) {
    /**
     * 执行外矿行为
     */
    const run = function () {
        // 检查是否需要生成新的采矿或运输 creep
        checkSpawnCreep(context.room);
        // 遍历所有的外矿 creep 
        let outerCreeps = _.filter(Game.creeps, i => i.memory.role == 'outerHarvester'
            || i.memory.role == 'outerCarrier'
            || i.memory.role == 'outerClaimer'
            || i.memory.role == 'outerDefender'
            || i.memory.role == 'outerBuilder');
        for (let i = 0; i < outerCreeps.length; ++i) {
            // 获取 creep 对象 
            let creep = outerCreeps[i];
            // 根据 creep 的角色执行不同的行为 
            switch (creep.memory.role) {
                // 0.22cpu
                case 'outerHarvester':
                    runHarvester(creep);
                    break;
                // 0.23cpu
                case 'outerCarrier':
                    runCarrier(creep, context.room);
                    break;
                // 0.23cpu
                case 'outerClaimer':
                    runOuterClaimer(creep);
                    break;
                // 0.3cpu
                case 'outerDefender':
                    runOuterDefender(creep);
                    break;
                case 'outerBuilder':
                    runOuterBuilder(creep);
                    break;
            }
        }
        return;
    };
    /**
     * 返回守护者的身体部件数组
     * @param room 生产守护者的房间
     * @returns {BodyPartConstant[]} 守护者的身体部件数组
     */
    const createOuterDefenderBody = function (room) {
        let energy = room.energyCapacityAvailable;
        let bodysNum = Math.floor(energy / 130);
        bodysNum = bodysNum > 10 ? 10 : bodysNum;
        let bodys = [];
        for (let i = 0; i < bodysNum; ++i) {
            bodys.push(MOVE);
        }
        for (let i = 0; i < bodysNum; ++i) {
            bodys.push(ATTACK);
        }
        return bodys;
    };
    /**
     * 返回采矿爬的身体
     * @param room 生产爬的房间
     * @returns {BodyPartConstant[]} 身体部件数组
     */
    const createHarvesterBody = function (room) {
        let energy = room.energyCapacityAvailable;
        let bodys = [WORK, WORK, CARRY, MOVE];
        if (energy >= 800) {
            bodys = [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE];
            return bodys;
        }
        const consume = 300;
        let times = Math.floor((energy - consume) / 250);
        for (let i = 0; i < times; ++i) {
            bodys.push(WORK, WORK, MOVE);
        }
        return bodys;
    };
    /**
     * 返回运输爬的身体
     * @param room 生产爬的房间
     * @returns {BodyPartConstant[]} 身体部件数组
     */
    const createCarrierBody = function (room) {
        let energy = room.energyCapacityAvailable;
        if (energy <= 300) {
            return [CARRY, MOVE];
        }
        let bodys = [];
        let carryNum = Math.floor(energy / 150);
        carryNum = carryNum >= 48 ? 48 : carryNum;
        for (let i = 0; i < carryNum; ++i) {
            bodys.push(CARRY, CARRY, MOVE);
        }
        return bodys;
    };
    /**
     * 返回预定者的身体部件数组
     * @returns {BodyPartConstant[]} 身体部件数组
     */
    const createOuterClaimerBody = function () {
        return [CLAIM, CLAIM, MOVE, MOVE];
    };
    /**
     * 返回外矿建筑师的身体部件数组
     * @param room 生产 creep 的房间
     * @returns {BodyPartConstant[]} 外矿建筑师的身体部件数组
     */
    const createOuterBuilderBody = function (room) {
        let energy = room.energyCapacityAvailable;
        let bodysNum = Math.floor(energy / 200);
        let body = [];
        for (let i = 0; i < bodysNum; ++i) {
            body.push(WORK, CARRY, MOVE);
        }
        return body;
    };
    /**
     * 返回守护者的名字
     * @param room 目标房间对象
     * @returns {string} 守护者的名字
     */
    const createOuterDefenderName = function (roomName) {
        return 'defender' + roomName + '_' + Game.time % 10;
    };
    /**
     * 生成采矿爬的名字
     * @param sourceId 目标 source 的ID
     * @returns {string} 采矿爬的名字
     */
    const createHarvesteName = function (roomName) {
        return 'outerHarvester' + roomName + '_' + Game.time % 10;
    };
    /**
     * 生成运输爬的名字
     * @param sourceId 目标 source 的ID
     * @param index 目标 source 的第几个运输爬
     * @returns {string} 运输爬的名字
     */
    const createCarrierName = function () {
        return 'outerCarrier' + '_' + Game.time % 100;
    };
    /**
     * 返回预定者的名字
     * @param roomName 目标外矿的房间名
     * @returns 预定者的名字
     */
    const createOuterClaimerName = function (roomName) {
        return 'outerClaimer' + '_' + roomName;
    };
    /**
     * 返回外矿建筑师的名字
     * @param roomName 目标外矿的房间名
     * @returns {string} 外矿建筑师的名字
     */
    const createOuterBuilderName = function (roomName) {
        return 'outerBuilder' + roomName + '_' + Game.time % 10;
    };
    /**
     * 生产外矿守护者
     * @param spawn 空闲的 spawn
     * @param flag 目标 outerSource 外矿的旗子
     * @param bornRoom 生产守护者的房间
     */
    const newOuterDefender = function (flag, bornRoom) {
        //  找到空闲的 spawn
        let spawn = context.returnFreeSpawn(bornRoom);
        // 若没有空闲的 spawn,则不检查了
        if (spawn == undefined) {
            return;
        }
        let name = createOuterDefenderName(flag.pos.roomName);
        let body = createOuterDefenderBody(bornRoom);
        let memory = {
            role: 'outerDefender',
            bornRoom: bornRoom.name,
            outerRoom: flag.pos.roomName,
            flag: { name: flag.name, pos: flag.pos },
        };
        // 生成一个新的守护者
        spawn.spawnCreep(body, name, {
            memory: memory,
            directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
        });
        return;
    };
    /**
     * 生产一个新的外矿采集者
     * @param spawn 空闲的 spawn
     * @param room 目标外矿对象
     * @param bornRoom 生产 creep 房间对象
     * @param source 目标 source
     */
    const newOuterHarvester = function (room, bornRoom, source) {
        //  找到空闲的 spawn
        let spawn = context.returnFreeSpawn(bornRoom);
        // 若没有空闲的 spawn,则不检查了
        if (spawn == undefined) {
            return;
        }
        let name = createHarvesteName(room.name);
        let body = createHarvesterBody(bornRoom);
        let memory = {
            role: 'outerHarvester',
            bornRoom: room.name,
            source: { id: source.id, pos: source.pos },
            outerRoom: room.name,
        };
        // 生成一个新的采矿 creep
        spawn.spawnCreep(body, name, {
            memory: memory,
            directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
        });
        return;
    };
    /**
     * 生产一个新的外矿采集者
     * @param spawn 空闲的 spawn
     * @param room 目标外矿对象
     * @param bornRoom 生产新的外矿采集者的房间对象
     * @param source 目标 source 对象
     */
    const newOuterCarrier = function (room, bornRoom, source) {
        //  找到空闲的 spawn
        let spawn = context.returnFreeSpawn(bornRoom);
        // 若没有空闲的 spawn,则不检查了
        if (spawn == undefined) {
            return;
        }
        let name = createCarrierName();
        let body = createCarrierBody(bornRoom);
        let memory = {
            role: 'outerCarrier',
            bornRoom: bornRoom.name,
            source: { id: source.id, pos: source.pos },
            outerRoom: room.name,
        };
        // 生成一个新的运输 creep
        spawn.spawnCreep(body, name, {
            memory: memory,
            directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
        });
        return;
    };
    /**
     * 生产一个新的预定者
     * @param spawn 空闲的 spawn
     * @param room 目标外矿对象
     * @param bornRoom 生产新的预定者的房间对象
     */
    const newOuterClaimer = function (room, bornRoom) {
        //  找到空闲的 spawn
        let spawn = context.returnFreeSpawn(bornRoom);
        // 若没有空闲的 spawn,则不检查了
        if (spawn == undefined) {
            return;
        }
        let name = createOuterClaimerName(room.name);
        let body = createOuterClaimerBody();
        let memory = {
            role: 'outerClaimer',
            bornRoom: bornRoom.name,
            outerRoom: room.name,
        };
        // 生成一个新的预定者
        spawn.spawnCreep(body, name, {
            memory: memory,
            directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
        });
        return;
    };
    /**
     * 生产新的外矿建筑师
     * @param spawn 空闲的 spawn
     * @param room 目标外矿对象
     * @param bornRoom 生产外矿建筑师的房间对象
     */
    const newOuterBuilder = function (room, bornRoom) {
        //  找到空闲的 spawn
        let spawn = context.returnFreeSpawn(bornRoom);
        // 若没有空闲的 spawn,则不检查了
        if (spawn == undefined) {
            return;
        }
        let name = createOuterBuilderName(room.name);
        let body = createOuterBuilderBody(bornRoom);
        let memory = {
            role: 'outerBuilder',
            bornRoom: bornRoom.name,
            outerRoom: room.name,
        };
        spawn.spawnCreep(body, name, {
            memory: memory,
            directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
        });
        return;
    };
    /**
     * 检查是否需要产 creep，如果是，则生产 creep
     * @param spawn 目标 spawn
     * @param bornRoom 生成 creep 的房间
     */
    const checkSpawnCreep = function (bornRoom) {
        // 找到所有名字中含有 outerSource 的旗子
        let flags = Object.keys(Game.flags).filter(key => key.includes('outerSource'));
        for (let i = 0; i < flags.length; ++i) {
            let flag = Game.flags[flags[i]];
            // 获取 flag 所在房间的对象
            let room = flag.room;
            // 检查是否有足够的守护者
            let outerDefender = _.find(Game.creeps, i => i.memory.role == 'outerDefender'
                && i.memory.outerRoom == flag.pos.roomName);
            if (outerDefender == undefined) {
                // 如果不够，则尝试生成一个新的守护者
                newOuterDefender(flag, bornRoom);
                // 返回
                return;
            }
            // 如果没有房间视野则返回,检查下一个外矿
            if (!room) {
                continue;
            }
            // 获取 flag 房间内的所有 source 对象
            let sources = Game.rooms[flag.pos.roomName].find(FIND_SOURCES);
            // 遍历每个能量矿
            for (let source of sources) {
                // 检查是否有足够数量的采矿 creep
                let outerHarvesters = _.filter(Game.creeps, i => i.memory.role == 'outerHarvester'
                    && i.memory.source.id == source.id);
                if (outerHarvesters.length < 1) {
                    // 如果不够，则尝试生成一个新的采矿 creep
                    newOuterHarvester(room, bornRoom, source);
                    // 返回，不再检查其他能量矿
                    return;
                }
                // 检查是否有足够数量的运输 creep
                let carriers = _.filter(Game.creeps, i => i.memory.role == 'outerCarrier'
                    && i.memory.source.id == source.id);
                if (carriers.length < 1) {
                    // 如果不够，则尝试生成一个新的运输 creep
                    newOuterCarrier(room, bornRoom, source);
                    // 返回，不再检查其他能量矿
                    return;
                }
            }
            // 控制器等级小于4没必要出预定者和建筑师
            if (bornRoom.controller.level < 4) {
                continue;
            }
            let builderDelay = false;
            if (Memory.delayTime != undefined
                && Memory.delayTime['outerBuilder' + room.name] != undefined) {
                let delay = Memory.delayTime['outerBuilder' + room.name];
                builderDelay = Game.time <= delay.time + delay.delay;
            }
            // 检查是否有建筑师
            let builder = _.find(Game.creeps, i => i.memory.role == 'outerBuilder'
                && i.memory.outerRoom == room.name);
            // 如果没有,则新生产一个
            if (builder == undefined && !builderDelay) {
                newOuterBuilder(room, bornRoom);
                return;
            }
            // 检查是否有预定者
            let claimer = _.find(Game.creeps, i => i.memory.role == 'outerClaimer'
                && i.memory.outerRoom == room.name);
            // 如果预定时间高于3000 则不用那么快生成
            if (room.controller.reservation != undefined
                && room.controller.reservation.ticksToEnd > 3000) {
                continue;
            }
            // 如果没有，则生成一个
            if (claimer == undefined) {
                newOuterClaimer(room, bornRoom);
                return;
            }
        }
        return;
    };
    /**
     * 执行采矿爬行为
     * @param creep 目标采矿爬对象
     */
    const runHarvester = function (creep) {
        let source = Game.getObjectById(creep.memory.source.id);
        if (!source) {
            creep.moveTo(new RoomPosition(25, 25, context.room.name), {
                reusePath: 20,
                maxOps: 1000,
            });
            return;
        }
        // 如果不在范围内，则向能量矿移动
        if (creep.pos.getRangeTo(source) > 1) {
            creep.moveTo(source, {
                maxOps: 1000,
            });
            return;
        }
        // 尝试采集能量矿
        let container = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => i.structureType == STRUCTURE_CONTAINER);
        if (container[0] != undefined) {
            if (creep.getActiveBodyparts(WORK) * 4 >
                creep.store.getFreeCapacity()) {
                let result = creep.transfer(container[0], RESOURCE_ENERGY);
                if (result == ERR_FULL) {
                    return;
                }
            }
        }
        creep.harvest(source);
        return;
    };
    /**
     * 执行运输爬行为
     * @param creep 目标运输爬对象
     * @param room 将能量带回来的房间，即生产房
     */
    const runCarrier = function (creep, room) {
        // 判断 creep 是否在工作模式
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            // 如果在工作模式且没有能量了，则切换到非工作模式
            creep.memory.working = false;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            // 如果在非工作模式且没有容量了，则切换到工作模式
            creep.memory.working = true;
        }
        // 根据工作模式执行不同的行为
        if (creep.memory.working) {
            if (creep.pos.roomName != room.name) {
                creep.moveTo(new RoomPosition(25, 25, room.name), {
                    reusePath: 20,
                    maxOps: 1000,
                });
                return;
            }
            // 在工作模式下，将能量运输回基地
            let storage = room.storage;
            if (storage != undefined) {
                if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, {
                        maxOps: 1000,
                    });
                }
                return;
            }
            // 获取基地的 container 对象
            let container = _.filter(room.find(FIND_STRUCTURES), i => i.structureType == STRUCTURE_CONTAINER
                && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            // 获取最近的 container 对象
            let target = creep.pos.findClosestByRange(container);
            // 如果没有找到最近的对象，说明并不在基地房间里，则向基地移动
            if (target == null) {
                return;
            }
            // 尝试将能量转移给 container
            let result = creep.transfer(target, RESOURCE_ENERGY);
            // 如果不在范围内，则向 container 移动
            if (result == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {
                    maxOps: 1000,
                });
            }
        }
        else {
            // 根据 id 获取能量矿对象
            let source = Game.getObjectById(creep.memory.source.id);
            // 如果没有找到能量矿对象，说明没有房间视野，则向 flag 移动
            if (!source) {
                creep.moveTo(source, {
                    maxOps: 1000,
                });
                return;
            }
            // 在非工作模式下，从 container 或地上掉落的资源中获取能量
            // 获取能量矿旁边的 container 对象
            let container = source.pos.findInRange(FIND_STRUCTURES, 2, {
                filter: s => s.structureType == STRUCTURE_CONTAINER
            })[0];
            // 获取 source 旁边掉落的资源对象
            let resource = source.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {
                filter: s => s.resourceType == RESOURCE_ENERGY
            })[0];
            // 如果没有找到 container 对象，则向 source 移动
            if (!container && !resource) {
                if (creep.pos.getRangeTo(source) < 3) {
                    return;
                }
                creep.moveTo(source, {
                    maxOps: 1000,
                });
                return;
            }
            // 尝试从 container 中取出能量
            let result = 0;
            if (container) {
                result = creep.withdraw(container, RESOURCE_ENERGY);
                // 如果不在范围内，则向 container 移动
                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, {
                        maxOps: 1000,
                    });
                }
            }
            else {
                result = creep.pickup(resource);
                // 如果不在范围内，则向 resource 移动
                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(resource, {
                        maxOps: 1000,
                    });
                }
            }
        }
        return;
    };
    /**
     * 执行预定者任务
     * @param creep 预定者对象
     */
    const runOuterClaimer = function (creep) {
        // 获取控制器对象
        let room = Game.rooms[creep.memory.outerRoom];
        // 如果没有找到房间对象，说明没有房间视野，则向该房间移动
        if (!room) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.outerRoom), {
                maxOps: 1000,
                reusePath: 20,
            });
            return;
        }
        // 尝试预定控制器,若不够距离则移动至控制器
        let controller = room.controller;
        if (creep.reserveController(controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(controller, {
                maxOps: 1000,
            });
            return;
        }
        if (controller.sign == undefined
            || controller.sign.username != creep.owner.username) {
            creep.signController(controller, "This is my outer room");
        }
        return;
    };
    /**
     * 守护者执行守护外矿任务
     * @param creep 守护者对象
     */
    const runOuterDefender = function (creep) {
        if (creep.pos.roomName != creep.memory.outerRoom) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.outerRoom), {
                maxOps: 1000,
            });
            return;
        }
        let room = Game.rooms[creep.memory.outerRoom];
        let enemies = _.filter(room.find(FIND_HOSTILE_CREEPS), i => i.body.find(i => i.type == ATTACK
            || i.type == RANGED_ATTACK
            || i.type == HEAL));
        if (enemies.length == 0) {
            creep.moveTo(creep.memory.flag.pos.x, creep.memory.flag.pos.y, {
                maxOps: 1000,
            });
            return;
        }
        let target = creep.pos.findClosestByRange(enemies);
        if (creep.attack(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, {
                maxOps: 1000,
            });
        }
        return;
    };
    const runOuterBuilder = function (creep) {
        if (creep.pos.roomName == creep.memory.bornRoom) {
            if (creep.store[RESOURCE_ENERGY] == 0) {
                let room = Game.rooms[creep.memory.bornRoom];
                let result = creep.withdraw(room.storage, RESOURCE_ENERGY);
                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(room.storage);
                }
                return;
            }
        }
        if (creep.pos.roomName != creep.memory.outerRoom) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.outerRoom), {
                maxOps: 1000,
            });
            return;
        }
        let room = Game.rooms[creep.pos.roomName];
        if (creep.store[RESOURCE_ENERGY] == 0) {
            let container = room.find(FIND_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_CONTAINER
                    && s.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()
            })[0];
            // 获取 source 旁边掉落的资源对象
            let resource = room.find(FIND_DROPPED_RESOURCES, {
                filter: s => s.resourceType == RESOURCE_ENERGY
                    && s.amount >= creep.store.getFreeCapacity()
            })[0];
            if (container != undefined) {
                if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(container);
                }
            }
            else if (resource != undefined) {
                if (creep.pickup(resource) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(resource);
                }
            }
            return;
        }
        let sites = room.find(FIND_CONSTRUCTION_SITES);
        let target = creep.pos.findClosestByRange(sites);
        if (target != undefined) {
            if (creep.build(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
            return;
        }
        let repairs = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => i.hits < i.hitsMax);
        if (repairs[0] != undefined) {
            creep.repair(repairs[0]);
            return;
        }
        let repairTargets = _.filter(room.find(FIND_STRUCTURES), i => i.hits < i.hitsMax);
        let repairTarget = creep.pos.findClosestByRange(repairTargets);
        if (repairTarget != undefined) {
            if (creep.repair(repairTarget) == ERR_NOT_IN_RANGE) {
                creep.moveTo(repairTarget);
            }
        }
        else {
            creep.suicide();
            if (Memory.delayTime == undefined) {
                Memory.delayTime = {};
            }
            if (Memory.delayTime['outerBuilder' + room.name] == undefined) {
                Memory.delayTime['outerBuilder' + room.name] = {
                    time: 0,
                    delay: 0,
                };
            }
            Memory.delayTime['outerBuilder' + room.name] = {
                time: Game.time,
                delay: 2000,
            };
        }
        return;
    };
    run();
};

const Withdraw = {
    /**
     * 从容器中拿取energy
     * @param creep
     * @param room
     */
    energy: function (creep, room) {
        let amount = creep.store.getFreeCapacity();
        let containers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "container"
            && i.store["energy"] >= amount);
        let links = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "link"
            && i.store.energy >= amount
            && i.pos.findInRange(FIND_SOURCES, 2).length == 0
            && i.pos.getRangeTo(room.find(FIND_MY_SPAWNS)[0]) != 1);
        let storage = room.storage;
        let targets = [...containers, ...links];
        if (storage != undefined) {
            if (storage.store["energy"] >= amount) {
                targets.push(storage);
            }
        }
        if (room.terminal != undefined) {
            if (room.terminal.store["energy"] >= 100000) {
                targets.push(room.terminal);
            }
        }
        let target = creep.pos.findClosestByRange(targets);
        if (target != undefined) ;
        else {
            return;
        }
        if (target instanceof Resource) {
            if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
            return;
        }
        else {
            if (creep.withdraw(target, "energy") == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        }
        return;
    }
};

const build = {
    run: function (room) {
        let sites = room.find(FIND_CONSTRUCTION_SITES);
        let builders = _.filter(Game.creeps, (creep) => creep.memory.role
            == "builder");
        if (sites.length == 0) {
            for (let i = 0; i < builders.length; ++i) {
                this.goRecycle(builders[i], room);
            }
            return;
        }
        if (builders.length < 1) {
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
    newBuilder: function (room) {
        let spawn = returnFreeSpawn(room);
        if (spawn == undefined) {
            return;
        }
        spawn.spawnCreep(this.createBuilderBody(room), this.createBuilderName(room), {
            memory: { role: 'builder', bornRoom: room.name },
            directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
        });
        return;
    },
    /**
     * 返回 builder 的名字
     * @param room 生产 creep 的房间
     * @returns {string} builder 的名字
     */
    createBuilderName: function (room) {
        return 'builder' + room.name;
    },
    /**
     * 返回 builder 的身体部件数组
     * @param room 生产 builder 的房间
     * @returns {BodyPartConstant[]} builder 的身体部件数组
     */
    createBuilderBody: function (room) {
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
    runBuilder: function (creep, room) {
        if (MyMemory.upateWorking(creep, "energy")) {
            let sites = room.find(FIND_CONSTRUCTION_SITES);
            if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sites[0]);
            }
        }
        else {
            Withdraw.energy(creep, room);
        }
        return;
    },
    /**
     * 当没有工地时，自动回去找到 spawn 执行 recycle
     * @param creep builder 对象
     * @param room 执行 recycle 的房间
     */
    goRecycle: function (creep, room) {
        let spawn = room.find(FIND_MY_SPAWNS)[0];
        if (spawn.recycleCreep(creep) == ERR_NOT_IN_RANGE) {
            creep.moveTo(spawn);
        }
        return;
    },
};

const towers = {
    repair: function (target, room) {
        let towers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "tower");
        let enemy = room.find(FIND_HOSTILE_CREEPS);
        if (enemy[0] != undefined) {
            return;
        }
        for (let i = 0; i < towers.length; ++i) {
            let tower = towers[i];
            tower.repair(target);
        }
        return;
    },
    defend: function (room) {
        let towers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "tower");
        let enemy = room.find(FIND_HOSTILE_CREEPS);
        if (enemy[0] == undefined) {
            return;
        }
        enemy = _.filter(enemy, i => i.pos.findInRange(FIND_EXIT, 2).length == 0);
        if (enemy[0] == undefined) {
            return;
        }
        for (let i = 0; i < towers.length; ++i) {
            let tower = towers[i];
            tower.attack(enemy[0]);
        }
        return;
    },
};

const Defend = {
    run: function (room) {
        let enemy = room.find(FIND_HOSTILE_CREEPS);
        if (enemy[0] == undefined) {
            return;
        }
        let PBCreep = enemy.find(i => i.owner.username == "PacifistBot"
            && i.body.find(i => i.type == ATTACK || i.type == RANGED_ATTACK));
        if (PBCreep != undefined) {
            let controller = room.controller;
            controller.activateSafeMode();
            Game.notify("SF ON");
        }
        towers.defend(room);
    }
};

const SpawnCreep = {
    newList: [{}],
    newCreep: function (room) {
        let spawns = room.find(FIND_MY_SPAWNS);
        for (let i = 0; i < spawns.length; ++i) {
            if (i >= this.newList.length) {
                break;
            }
            if (this.newList[i].role == undefined) {
                continue;
            }
            let name = this.newList[i].role + Game.time;
            let role = this.newList[i].role;
            if (role == "harvester" || role == "worker") {
                name = (Game.time + this.newList[i].opt);
            }
            spawns[i].spawnCreep(this.newList[i].bodys, name, { memory: { role: this.newList[i].role, bornRoom: spawns[i].room.name },
                directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
            });
        }
        this.newList = [];
        return;
    },
};

const FastUpgrade = {
    run: function (room) {
        let workers = _.filter(room.find(FIND_MY_CREEPS), i => i.memory.role == "worker");
        let sources = room.find(FIND_SOURCES);
        let sourcePoints = [0, 0];
        let pointsSum = 0;
        for (let i = 0; i < sources.length; ++i) {
            sourcePoints[i] = this.findFreePoint(sources[i].pos, room);
            pointsSum += sourcePoints[i];
        }
        if (workers.length < pointsSum) {
            let sourceId = sources[0].id;
            for (let i = 0; i < sources.length; ++i) {
                let id = sources[i].id;
                let temp = workers.filter(creep => creep.name.indexOf(id) != -1);
                if (temp.length >= sourcePoints[i]) {
                    continue;
                }
                else {
                    sourceId = id;
                    break;
                }
            }
            this.newCreep(room, sourceId);
        }
        for (let i = 0; i < workers.length; ++i) {
            if (MyMemory.upateWorking(workers[i], "energy")) {
                if (this.transferEnergy(workers[i], room)) {
                    continue;
                }
                if (i != workers.length - 1) {
                    if (this.goBuild(workers[i], room)) {
                        continue;
                    }
                }
                this.goUpgrade(workers[i], room);
            }
            else {
                this.goHarvest(workers[i], room);
            }
        }
    },
    newCreep: function (room, sourceId) {
        let newListPush = {
            role: "worker",
            bodys: this.returnBodys(room),
        };
        if (sourceId != undefined) {
            newListPush.opt = sourceId;
        }
        SpawnCreep.newList.push(newListPush);
    },
    goHarvest: function (creep, room) {
        let sources = room.find(FIND_SOURCES);
        let source = sources.find(i => creep.name.indexOf(i.id) != -1);
        if (source == undefined) {
            creep.say("ERR_NOT_FOUND_SOURCE");
            return;
        }
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
        }
        return;
    },
    goUpgrade: function (creep, room) {
        //if (this.goBuild(creep, room)) {
        //  return;
        //}
        let controller = room.controller;
        if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(controller);
        }
        if (controller.sign == undefined
            || controller.sign.username != creep.owner.username) {
            if (creep.signController(controller, "Declare war on PB!")
                == ERR_NOT_IN_RANGE) {
                creep.moveTo(controller);
            }
        }
        return;
    },
    goBuild: function (creep, room) {
        let sites = room.find(FIND_CONSTRUCTION_SITES);
        if (sites.length == 0) {
            return false;
        }
        if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(sites[0]);
        }
        return true;
    },
    transferToExtension: function (creep, room) {
        let extensions = _.filter(room.find(FIND_STRUCTURES), i => i.structureType == "extension"
            && i.store.getFreeCapacity("energy") > 0);
        if (extensions.length == 0) {
            return false;
        }
        if (creep.transfer(extensions[0], "energy") == ERR_NOT_IN_RANGE) {
            creep.moveTo(extensions[0]);
        }
        return true;
    },
    transferEnergy: function (creep, room) {
        if (this.transferToExtension(creep, room)) {
            return true;
        }
        let spawn = room.find(FIND_MY_SPAWNS)[0];
        if (spawn.store.getFreeCapacity("energy") == 0) {
            return false;
        }
        if (creep.transfer(spawn, "energy") == ERR_NOT_IN_RANGE) {
            creep.moveTo(spawn);
        }
        return true;
    },
    returnBodys: function (room) {
        let energy = room.energyAvailable;
        let bodys = [WORK, WORK, CARRY, MOVE, MOVE, MOVE];
        if (energy < 400) {
            bodys = [WORK, CARRY, MOVE];
            return bodys;
        }
        else if (energy >= 450) {
            bodys = [WORK, WORK, WORK, CARRY, MOVE, MOVE];
        }
        return bodys;
    },
    findFreePoint: function (pos, room) {
        let top = pos.y - 1;
        let left = pos.x - 1;
        let bottom = pos.y + 1;
        let right = pos.x + 1;
        let area = room.lookForAtArea("terrain", top, left, bottom, right, true);
        let count = 0;
        for (let i = 0; i < 9; ++i) {
            if (area[i].terrain == "plain" || area[i].terrain == "swamp") {
                count += 1;
            }
        }
        return count;
    },
};

const harvest = {
    /**
     * 执行采集任务
     * @param room 执行采集任务的房间
     */
    run: function (room) {
        let sources = room.find(FIND_SOURCES);
        let harvesters = _.filter(room.find(FIND_MY_CREEPS), (creep) => creep.memory.role == "harvester");
        if (harvesters.length < sources.length) {
            for (let i = 0; i < sources.length; ++i) {
                let id = sources[i].id;
                if (!harvesters.find(creep => creep.memory.source.id == id)) {
                    this.newHarvester(room, id);
                    break;
                }
            }
        }
        for (let i = 0; i < harvesters.length; ++i) {
            this.runHarvester(harvesters[i]);
        }
        return;
    },
    /**
     * 返回 harvester 的名字
     * @param room 生产 harvester 的房间
     * @param sourceId 目标能量矿的 ID
     * @returns {string} harvester 的名字
     */
    createHarvesterName: function (room) {
        return 'harvester' + room.name + '_' + Game.time % 10;
    },
    /**
     * 返回 harvester 的身体部件数组
     * @param room 生产 harvester 的房间
     * @returns {BodyPartConstant[]} harvester 的身体部件数组
     */
    createHarvesterBody: function (room) {
        let energy = room.energyAvailable;
        let bodys = [WORK, WORK, CARRY, MOVE];
        const consume = 300;
        let times = Math.floor((energy - consume) / 250);
        if (times >= 3)
            times = 3;
        for (let i = 0; i < times; ++i) {
            bodys.push(WORK, WORK, MOVE);
        }
        return bodys;
    },
    /**
     * 生产一个新的 harvester
     * @param room 执行采集任务的房间对象
     * @param sourceId 目标能量矿的 ID
     */
    newHarvester: function (room, sourceId) {
        let spawn = returnFreeSpawn(room);
        if (spawn == undefined) {
            return;
        }
        let source = Game.getObjectById(sourceId);
        spawn.spawnCreep(this.createHarvesterBody(room), this.createHarvesterName(room), { memory: {
                role: 'harvester',
                bornRoom: room.name,
                source: { id: sourceId, pos: source.pos },
            },
            directions: [TOP_LEFT, LEFT, BOTTOM_LEFT], });
        return;
    },
    /**
     * harvester 执行采集任务
     * @param creep harvester 对象
     * @param room 执行采集任务的房间
     */
    runHarvester: function (creep) {
        let source = Game.getObjectById(creep.memory.source.id);
        if (source == undefined) {
            return;
        }
        if (creep.pos.getRangeTo(source) != 1) {
            creep.moveTo(source, { maxOps: 100, });
            return;
        }
        if (this.transferExtension(creep)) {
            return;
        }
        else if (this.transferOut(creep)) {
            creep.harvest(source);
            return;
        }
        if (creep.store.getFreeCapacity() >= creep.getActiveBodyparts(WORK) * 2) {
            creep.harvest(source);
        }
        return;
    },
    /**
     * 对身边一格范围内的 extension 运输能量
     * @param creep harvester 对象
     * @returns {boolean} 是否成功执行运输任务
     */
    transferExtension: function (creep) {
        let extensions = _.filter(creep.pos.findInRange(FIND_STRUCTURES, 1), i => i.structureType == STRUCTURE_EXTENSION
            && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
        if (extensions.length == 0) {
            return false;
        }
        if (creep.store[RESOURCE_ENERGY] < creep.store.getCapacity()) {
            return this.withdrawEnergy(creep) ? true : false;
        }
        creep.transfer(extensions[0], RESOURCE_ENERGY);
        return true;
    },
    /**
     * harvester 从容器获取能量
     * @param creep harvseter 对象
     * @returns {boolean} 是否成功获取能量
     */
    withdrawEnergy: function (creep) {
        let container = _.find(creep.pos.findInRange(FIND_STRUCTURES, 1), i => i.structureType == STRUCTURE_CONTAINER
            && i.store[RESOURCE_ENERGY] >= 50);
        if (container != undefined) {
            creep.withdraw(container, RESOURCE_ENERGY);
            return true;
        }
        let link = _.find(creep.pos.findInRange(FIND_STRUCTURES, 1), i => i.structureType == STRUCTURE_LINK
            && i.store[RESOURCE_ENERGY] >= 50);
        if (link != undefined) {
            creep.withdraw(link, RESOURCE_ENERGY);
            return true;
        }
        return false;
    },
    /**
     * 将 harvester 储存的能量运输至容器中
     * @param creep harvester 对象
     * @returns {boolean} 是否成功执行运输任务
     */
    transferOut: function (creep) {
        if (creep.store.getFreeCapacity() >= creep.getActiveBodyparts(WORK) * 4) {
            return false;
        }
        let link = _.find(creep.pos.findInRange(FIND_STRUCTURES, 1), i => i.structureType == STRUCTURE_LINK);
        if (link != undefined) {
            let result = creep.transfer(link, RESOURCE_ENERGY);
            return result == 0 ? true : false;
        }
        let container = _.find(creep.pos.findInRange(FIND_STRUCTURES, 1), i => i.structureType == STRUCTURE_CONTAINER);
        if (container != undefined) {
            let result = creep.transfer(container, RESOURCE_ENERGY);
            return result == 0 ? true : false;
        }
        return false;
    },
};

const Carrier = {
    goTransfer: function (creep, room, target, transfered, costs) {
        const resouceType = Object.keys(creep.store)[0];
        if (resouceType != "energy") {
            if (room.storage == undefined) {
                return false;
            }
            if (creep.transfer(room.storage, resouceType)
                == ERR_NOT_IN_RANGE) {
                creep.moveTo(room.storage);
                return false;
            }
        }
        if (transfered || creep.transfer(target, resouceType)
            == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
            return false;
        }
        if (target.store.getFreeCapacity("energy") >= creep.store[resouceType]) {
            creep.memory.working = false;
        }
        return true;
    },
    goWithdrawEnergy: function (creep, room, costs) {
        let amount = creep.store.getFreeCapacity();
        if (amount == 0) {
            return;
        }
        let containers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "container"
            && (i.store["energy"] >= amount || i.store["energy"] >= 500)
            && i.pos.findInRange(FIND_SOURCES, 2)[0] != undefined);
        let links = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "link"
            && i.store["energy"] >= 100
            && i.pos.findInRange(FIND_SOURCES, 2).length == 0
            && i.pos.getRangeTo(room.controller) > 3
            && i.pos.getRangeTo(room.find(FIND_MY_SPAWNS)[0]) != 1);
        let targets = [...containers, ...links];
        if (room.terminal != undefined) {
            if (room.terminal.store["energy"] >= 100000) {
                targets.push(room.terminal);
            }
        }
        if (targets.length == 0) {
            if (room.storage != undefined) {
                if (room.storage.store["energy"] >= amount) {
                    targets.push(room.storage);
                }
            }
        }
        let target = creep.pos.findClosestByRange(targets);
        if (target != undefined) ;
        else {
            return;
        }
        if (target instanceof Resource) {
            if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
            return;
        }
        else {
            if (creep.withdraw(target, "energy") == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        }
        return;
    }
};

const links = {
    transferEnergy: function (room) {
        let links = _.filter(room.find(FIND_STRUCTURES), i => i.structureType == "link");
        let link = _.find(links, i => i.pos.findInRange(room.find(FIND_SOURCES), 2).length == 0
            && i.pos.getRangeTo(room.find(FIND_MY_SPAWNS)[0]) != 1);
        if (link == undefined) {
            return;
        }
        links.splice(links.indexOf(link), 1);
        for (let i = 0; i < links.length; ++i) {
            if (links[i].store["energy"] >= 100) {
                links[i].transferEnergy(link);
            }
        }
        return;
    },
};

const MineralCarrier = {
    run: function (room) {
        var _a;
        let extractor = _.find(room.find(FIND_STRUCTURES), i => i.structureType == "extractor");
        if (extractor == undefined) {
            return;
        }
        let creep = _.filter(room.find(FIND_MY_CREEPS), i => i.memory.role == "mineralCarrier")[0];
        if (creep == undefined) {
            let newListPush = {
                role: "mineralCarrier",
                bodys: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                    CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                    MOVE, MOVE, MOVE,
                    MOVE, MOVE, MOVE],
            };
            SpawnCreep.newList.push(newListPush);
            return;
        }
        if (room.terminal != undefined) {
            let store = _.filter(Object.keys(room.terminal.store), i => i != "energy" && i != "LO")[0];
            if (store != undefined) {
                if (creep.store.getCapacity() == creep.store.getUsedCapacity()) {
                    let amount = creep.store[store];
                    if (creep.transfer(room.storage, store, amount) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(room.storage);
                    }
                }
                else if (creep.withdraw(room.terminal, store) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(room.terminal);
                }
                return;
            }
        }
        let container = room.find(FIND_MINERALS)[0].pos
            .findInRange(room.find(FIND_STRUCTURES), 1).filter(i => i.structureType == "container")[0];
        if (container.store.getUsedCapacity() > 200) {
            let store = _.filter(Object.keys(container.store), i => i != "energy")[0];
            if (creep.store.getCapacity() == creep.store.getUsedCapacity()) {
                let store = Object.keys(creep.store)[0];
                let amount = creep.store[store];
                if (creep.transfer(room.storage, store, amount) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(room.storage);
                }
                return;
            }
            else if (creep.withdraw(container, store) == ERR_NOT_IN_RANGE) {
                creep.moveTo(container);
            }
            return;
        }
        let labs = _.filter(room.find(FIND_STRUCTURES), i => i.structureType == "lab");
        let noCdLab = _.find(labs, i => i.cooldown == 0);
        if (labs.length <= 3) {
            noCdLab = labs[0];
        }
        if (noCdLab == undefined) {
            return;
        }
        labs.splice(labs.indexOf(noCdLab), 1);
        if (noCdLab == undefined) {
            return;
        }
        let store = Object.keys(noCdLab.store).find(i => i != "energy" && i != "LO");
        if (store != undefined) {
            if (creep.store.getUsedCapacity() > 0) {
                let store = Object.keys(creep.store)[0];
                let amount = creep.store[store];
                if (creep.transfer(room.storage, store, amount) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(room.storage);
                }
                return;
            }
            if (creep.withdraw(noCdLab, store) == ERR_NOT_IN_RANGE) {
                creep.moveTo(noCdLab);
            }
            return;
        }
        if (labs[0].store["O"] <= 1000) {
            let store = Object.keys(labs[0].store).find(i => i != "energy" && i != "O");
            if (store != undefined) {
                if (creep.withdraw(labs[0], store) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(labs[0]);
                }
                return;
            }
            if (creep.store["O"] == 0) {
                if (creep.store.getUsedCapacity() == creep.store.getCapacity()) {
                    let store = "O";
                    if (creep.transfer(room.storage, store) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(room.storage);
                    }
                    return;
                }
                if (creep.withdraw(room.storage, "O") == ERR_NOT_IN_RANGE) {
                    creep.moveTo(room.storage);
                }
                return;
            }
            if (creep.transfer(labs[0], "O") == ERR_NOT_IN_RANGE) {
                creep.moveTo(labs[0]);
            }
            return;
        }
        if (labs[1].store["L"] <= 1000) {
            let store = Object.keys(labs[1].store).find(i => i != "energy" && i != "L");
            if (store != undefined) {
                if (creep.withdraw(labs[1], store) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(labs[1]);
                }
                return;
            }
            if (creep.store["L"] == 0) {
                if (creep.store.getUsedCapacity() == creep.store.getCapacity()) {
                    let store = "L";
                    if (creep.transfer(room.storage, store) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(room.storage);
                    }
                    return;
                }
                if (creep.withdraw(room.storage, "L") == ERR_NOT_IN_RANGE) {
                    creep.moveTo(room.storage);
                }
                return;
            }
            if (creep.transfer(labs[1], "L") == ERR_NOT_IN_RANGE) {
                creep.moveTo(labs[1]);
            }
            return;
        }
        if (room.terminal != undefined) {
            if (((_a = room.terminal) === null || _a === void 0 ? void 0 : _a.store["LO"]) < 10000) {
                let storage = room.storage;
                if (creep.store["LO"] == 0) {
                    if (creep.store.getUsedCapacity()
                        == creep.store.getCapacity()) {
                        let store = Object.keys(creep.store)[0];
                        let amount = creep.store[store];
                        if (creep.transfer(room.storage, store, amount)
                            == ERR_NOT_IN_RANGE) {
                            creep.moveTo(storage);
                        }
                        return;
                    }
                    else if (creep.withdraw(storage, "LO") == ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage);
                    }
                    return;
                }
                else {
                    if (creep.transfer(room.terminal, "LO") == ERR_NOT_IN_RANGE) {
                        creep.moveTo(room.terminal);
                    }
                    return;
                }
            }
        }
        if (creep.store.getUsedCapacity() > 0) {
            let store = Object.keys(creep.store)[0];
            let amount = creep.store[store];
            if (creep.transfer(room.storage, store, amount) == ERR_NOT_IN_RANGE) {
                creep.moveTo(room.storage);
            }
            return;
        }
        store = "LO";
        if (noCdLab.store[store] > 1000) {
            if (creep.withdraw(noCdLab, "LO") == ERR_NOT_IN_RANGE) {
                creep.moveTo(noCdLab);
            }
        }
        return;
    },
};

const Transfer = {
    run: function (room, costs) {
        links.transferEnergy(room);
        let carriers = _.filter(Game.creeps, (creep) => creep.memory.role
            == "carrier");
        if (carriers.length < 2) {
            this.newCarrier(room);
        }
        let spawnPos = room.find(FIND_MY_SPAWNS)[0].pos;
        let lookForCenterContainers = _.filter(room.lookForAtArea(LOOK_STRUCTURES, spawnPos.y - 2, spawnPos.x, spawnPos.y + 2, spawnPos.x + 2, true), i => i.structure.structureType == STRUCTURE_EXTENSION);
        let centerContainers = lookForCenterContainers.map(i => i.structure.id);
        let transferTargets = _.filter(room.find(FIND_STRUCTURES), (i) => "store" in i
            && i.store["energy"] < i.store.getCapacity("energy")
            && (i.structureType == "spawn"
                || (i.structureType == "extension"
                    && i.pos.findInRange(FIND_SOURCES, 2).length == 0
                    && !centerContainers.includes(i.id))
                || (i.structureType == "tower" && i.store[RESOURCE_ENERGY] < 600)
                || (i.structureType == "terminal" && i.store["energy"] < 50000)
                || i.structureType == "lab"
                || (i.structureType == "container"
                    && i.store[RESOURCE_ENERGY] < 1500
                    && i.pos.findInRange(FIND_SOURCES, 2).length == 0
                    && i.pos.findInRange(FIND_MINERALS, 1).length == 0)));
        if (transferTargets.length == 0) {
            if (room.storage != undefined) {
                transferTargets.push(room.storage);
            }
            else {
                return;
            }
        }
        const unsplice = ["storage"];
        let transfered = -1;
        for (let i = 0; i < carriers.length; ++i) {
            if (i != 0 && transferTargets[0] == undefined) {
                if (room.storage != undefined) {
                    transferTargets[0] = room.storage;
                }
            }
            let carrier = carriers[i];
            if (MyMemory.upateWorking(carrier, "energy")
                && transferTargets[0] != undefined) {
                let target = carrier.pos.
                    findClosestByRange(transferTargets);
                if (target != null) {
                    carrier.say(target.structureType);
                }
                if (!unsplice.includes(target.structureType)) {
                    transferTargets.splice(transferTargets.indexOf(target), 1);
                }
                if (Carrier.goTransfer(carrier, room, target, transfered == i, costs)) {
                    if (target != room.storage
                        && carrier.store["energy"]
                            - target.store.getFreeCapacity(RESOURCE_ENERGY) >= 0) {
                        transfered = i;
                        --i;
                    }
                }
            }
            else {
                Carrier.goWithdrawEnergy(carrier, room, costs);
            }
        }
        MineralCarrier.run(room);
    },
    newCarrier: function (room) {
        if (!returnFreeSpawn(room)) {
            return;
        }
        let newListPush = {
            role: "carrier",
            bodys: this.returnBodys(room),
        };
        SpawnCreep.newList.push(newListPush);
        return;
    },
    returnBodys: function (room) {
        let energy = room.energyAvailable;
        if (energy <= 300) {
            return [CARRY, MOVE];
        }
        let bodys = [];
        let carryNum = Math.floor(energy / 100) / 2;
        carryNum = carryNum >= 12 ? 12 : carryNum;
        for (let i = 0; i < carryNum; ++i) {
            bodys.push(CARRY, MOVE);
        }
        return bodys;
    },
    getTransferTask: function (room) {
    },
};

const Upgrader = {
    run: function (upgrader, room) {
        if (MyMemory.upateWorking(upgrader, "energy")) {
            if (this.signController(upgrader, room)) {
                this.upgradeController(upgrader, room);
            }
        }
        else {
            Withdraw.energy(upgrader, room);
        }
    },
    signController: function (creep, room) {
        let controller = room.controller;
        if (controller == undefined) {
            return true;
        }
        if (controller.sign == undefined
            || controller.sign.username != creep.owner.username) {
            if (creep.signController(controller, "should be or not to be")
                == ERR_NOT_IN_RANGE) {
                creep.moveTo(controller);
                return false;
            }
            return true;
        }
        return true;
    },
    upgradeController: function (creep, room) {
        let controller = room.controller;
        if (controller == undefined) {
            return false;
        }
        if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(controller);
        }
        return true;
    },
};

const Upgrade = {
    run: function (room, upgradersNum) {
        let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role
            == "upgrader" && creep.pos.roomName == room.name);
        if (upgradersNum == undefined) {
            upgradersNum = 1;
        }
        if (upgraders.length < upgradersNum) {
            let newListPush = {
                role: "upgrader",
                bodys: this.returnBodys(room),
            };
            SpawnCreep.newList.push(newListPush);
        }
        if (upgraders.length == 0) {
            return;
        }
        for (let i = 0; i < upgraders.length; ++i) {
            Upgrader.run(upgraders[i], room);
        }
        return;
    },
    returnBodys: function (room) {
        let energy = room.energyCapacityAvailable;
        let bodys = [WORK, CARRY, MOVE];
        if (energy <= 300) {
            return bodys;
        }
        const consume = 200;
        let times = Math.floor((energy - consume) / 250);
        for (let i = 0; i < times; ++i) {
            bodys.push(WORK, WORK, MOVE);
        }
        return bodys;
    },
};

const RoomVisual = {
    run: function (roomName) {
        this.upgrade(roomName);
        this.spawnCreep(roomName);
    },
    upgrade: function (roomName) {
        let room = Game.rooms[roomName];
        room.visual.text(roomName, 25, 25, { align: "left" });
        let controller = room.controller;
        if (controller != undefined) {
            let progress = Math.floor((controller.progress
                / controller.progressTotal) * 10000) / 100;
            room.visual.text("升级", 25, 26, {
                color: "green",
                align: "left",
            });
            room.visual.text(progress + "%", 30, 26, {
                align: "center",
                color: "green"
            });
            room.visual.rect(27, 25.3, progress / 10, 1, { fill: "green" });
        }
        return;
    },
    spawnCreep: function (roomName) {
        let room = Game.rooms[roomName];
        let spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length == 0) {
            return;
        }
        for (let i = 0; i < spawns.length; ++i) {
            let pos = spawns[i].pos;
            let spawning = spawns[i].spawning;
            if (spawning != undefined) {
                room.visual.text(spawning.name, pos.x + 1, pos.y, {
                    align: "left",
                    color: "green",
                });
            }
        }
        return;
    },
};

const Repair = {
    run: function (room) {
        let roomTowers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "tower");
        if (roomTowers.length > 0) {
            let creep = _.find(room.find(FIND_MY_CREEPS), i => i.hits < i.hitsMax);
            if (creep != undefined) {
                roomTowers[0].heal(creep);
                return;
            }
            let structures = room.find(FIND_STRUCTURES).filter(i => i.hits < i.hitsMax
                && i.structureType != STRUCTURE_WALL
                && i.structureType != STRUCTURE_RAMPART
                || (i.structureType == STRUCTURE_RAMPART && i.hits < 1000));
            structures.sort((a, b) => a.hits - b.hits);
            for (let i = 0; i < structures.length && i < roomTowers.length; ++i) {
                towers.repair(structures[i], room);
            }
        }
        return;
    },
};

const centerTransfer = {
    /**
     * 执行中央的运输任务
     * @param room 执行的房间
     */
    run: function (room) {
        // 当房间等级小于4时返回
        if (room.controller.level < 4) {
            return;
        }
        // 只在第一个 spawn 产中央运输爬
        let spawn = room.find(FIND_MY_SPAWNS)[0];
        // 检查是否需要生成新的运输爬
        this.checkSpawnCreep(spawn, room);
        // 遍历找到所有中央爬
        let centerTransferer = _.filter(room.find(FIND_MY_CREEPS), i => i.memory.role == "centerTransferer");
        // 执行任务
        for (let i = 0; i < centerTransferer.length; ++i) {
            this.runCenterTransferer(centerTransferer[i], room);
        }
        let link = _.find(room.find(FIND_STRUCTURES), i => i.structureType == STRUCTURE_LINK
            && i.pos.getRangeTo(spawn) == 1);
        if (link == undefined) {
            return;
        }
        this.runCenterLink(link, room);
        return;
    },
    /**
     * 返回中央运输爬的身体
     * @returns {BodyPartConstant[]} 运输爬的身体
     */
    createTransfererBody: function (room) {
        let carryNum = room.controller.level - 3;
        let bodys = [];
        for (let i = 0; i < carryNum; ++i) {
            bodys.push(CARRY);
        }
        return bodys;
    },
    /**
     * 返回中央运输爬的名字
     * @returns {string} 运输爬的名字
     */
    createTransfererName: function (room) {
        return "centerTransferer" + room.name + '_' + Game.time % 10;
    },
    /**
     * 检查是否需要生产新的中央运输爬
     * @param spawn 执行生产任务的 spawn
     * @param room 执行任务的房间
     */
    checkSpawnCreep: function (spawn, room) {
        let centerTransferer = _.filter(room.find(FIND_MY_CREEPS), i => i.memory.role == "centerTransferer");
        if (centerTransferer.length < 2) {
            if (!spawns.isFreeFirstSpawn(room, 'centerTransferer')) {
                return;
            }
            let name = this.createTransfererName(room);
            let body = this.createTransfererBody(room);
            let memory = {
                role: 'centerTransferer',
                bornRoom: room.name,
            };
            spawn.spawnCreep(body, name, {
                memory: memory,
                directions: [TOP_RIGHT, BOTTOM_RIGHT],
            });
            return;
        }
    },
    /**
     * 中央运输爬执行运输任务
     * @param creep 目标中央运输爬
     * @param room 执行任务的房间
     */
    runCenterTransferer: function (creep, room) {
        if (creep.store[RESOURCE_ENERGY] == 0) {
            let targets = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => "store" in i
                && i.store[RESOURCE_ENERGY] > 0
                && (i.structureType == STRUCTURE_CONTAINER
                    || i.structureType == STRUCTURE_STORAGE
                    || i.structureType == STRUCTURE_TERMINAL));
            creep.withdraw(targets[0], RESOURCE_ENERGY);
        }
        else {
            let targets = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => "store" in i
                && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                && (i.structureType == STRUCTURE_EXTENSION
                    || i.structureType == STRUCTURE_SPAWN));
            creep.transfer(targets[0], RESOURCE_ENERGY);
        }
        return;
    },
    /**
     * 将中央 Link 的能量传送至升级 Link
     * @param link 中央运输 Link
     * @param room 执行运输任务的房间
     */
    runCenterLink: function (link, room) {
        if (link.store[RESOURCE_ENERGY] < 400) {
            return;
        }
        let upgradeLink = _.find(room.find(FIND_STRUCTURES), i => i.structureType == STRUCTURE_LINK
            && i.pos.getRangeTo(room.controller) <= 3);
        if (upgradeLink == undefined) {
            return;
        }
        if (upgradeLink.store[RESOURCE_ENERGY] <= 400) {
            link.transferEnergy(upgradeLink);
        }
        return;
    },
};

const RoomMaintain = {
    run: function () {
        for (let roomName in Game.rooms) {
            let room = Game.rooms[roomName];
            if (room.controller == undefined || !room.controller.my) {
                continue;
            }
            let level = 0;
            if (room.controller != undefined) {
                level = room.controller.level;
            }
            centerTransfer.run(room);
            if (level < 3) {
                FastUpgrade.run(room);
                Defend.run(room);
                return;
            }
            RoomVisual.run(roomName);
            let costs = this.roomCallBack(room);
            harvest.run(room);
            Transfer.run(room, costs);
            build.run(room);
            if (room.find(FIND_CONSTRUCTION_SITES).length == 0) {
                Upgrade.run(room, 3);
            }
            else {
                Upgrade.run(room);
            }
            Repair.run(room);
            Defend.run(room);
        }
    },
    roomCallBack: function (room) {
        let costs = new PathFinder.CostMatrix;
        room.find(FIND_STRUCTURES).forEach(struct => {
            if (struct.structureType === STRUCTURE_ROAD) {
                // road 成本设置为1
                costs.set(struct.pos.x, struct.pos.y, 1);
            }
            else if (struct.structureType !== STRUCTURE_CONTAINER
                && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {
                // 除 container 和 rampart 外所有建筑或不是自己的建筑成本设置为255
                costs.set(struct.pos.x, struct.pos.y, 255);
            }
        });
        room.find(FIND_MY_CONSTRUCTION_SITES).forEach(cons => {
            if (cons.structureType !== 'road'
                && cons.structureType !== 'rampart'
                && cons.structureType !== "container") {
                costs.set(cons.pos.x, cons.pos.y, 255);
            }
        });
        room.find(FIND_HOSTILE_CREEPS).forEach(creep => {
            costs.set(creep.pos.x, creep.pos.y, 255);
        });
        room.find(FIND_MY_CREEPS).forEach(creep => {
            if (creep.memory.role == "harvester") {
                costs.set(creep.pos.x, creep.pos.y, 255);
            }
        });
        return costs;
    },
};

/**
 * 每 tick 都执行的动作
 * @returns {void}
 */
const loop = function () {
    // 运行市场的自动买卖
    global.Market.run();
    // 运行内存的管理
    MyMemory.run();
    // 运营每一个房间
    RoomMaintain.run();
    let room = Game.rooms["E41N49"];
    outerSource({
        room: room,
        returnFreeSpawn: returnFreeSpawn,
    });
    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];
        if (room.controller == undefined || room.controller.my == false) {
            continue;
        }
        // 生产 creep
        SpawnCreep.newCreep(room);
    }
    return;
};

exports.loop = loop;
