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
            console.log(orders[i].price);
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
    },
};

const outerSource = {
    /**
     * 执行外矿行为
     * @param room 执行外矿的房间
     */
    run: function (room) {
        // 检查是否需要生成新的采矿或运输 creep
        let spawn = room.find(FIND_MY_SPAWNS)[0];
        this.checkSpawnCreep(spawn, room);
        // 遍历所有的外矿 creep 
        let outerCreeps = _.filter(Game.creeps, i => i.memory.role == 'outerHarvester'
            || i.memory.role == 'outerCarrier'
            || i.memory.role == 'outerClaimer');
        for (let i = 0; i < outerCreeps.length; ++i) {
            // 获取 creep 对象 
            let creep = outerCreeps[i];
            // 根据 creep 的角色执行不同的行为 
            if (creep.memory.role == 'outerHarvester') {
                this.runHarvester(creep);
            }
            else if (creep.memory.role == 'outerCarrier') {
                this.runCarrier(creep, room);
            }
            else if (creep.memory.role == 'outerClaimer') {
                this.runOuterClaimer(creep);
            }
        }
        return;
    },
    /**
     * 返回采矿爬的身体
     * @param room 生产爬的房间
     * @returns {BodyPartConstant[]} 身体部件数组
     */
    createHarvesterBody: function (room) {
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
    },
    /**
     * 返回运输爬的身体
     * @param room 生产爬的房间
     * @returns {BodyPartConstant[]} 身体部件数组
     */
    createCarrierBody: function (room) {
        let energy = room.energyCapacityAvailable;
        let bodys = [CARRY, MOVE];
        if (energy <= 300) {
            bodys = [CARRY, MOVE];
        }
        const consume = 100;
        let times = Math.floor((energy - consume) / 100);
        for (let i = 0; i < times; ++i) {
            bodys.push(CARRY, MOVE);
        }
        return bodys;
    },
    /**
     * 返回预定者的身体部件数组
     * @returns {BodyPartConstant[]} 身体部件数组
     */
    createOuterClaimerBody: function () {
        return [CLAIM, CLAIM, MOVE, MOVE];
    },
    /**
     * 生成采矿爬的名字
     * @param sourceId 目标 source 的ID
     * @returns {string} 采矿爬的名字
     */
    createHarvesteName: function (sourceId) {
        return 'outerHarvester_' + sourceId;
    },
    /**
     * 生成运输爬的名字
     * @param sourceId 目标 source 的ID
     * @param index 目标 source 的第几个运输爬
     * @returns {string} 运输爬的名字
     */
    createCarrierName: function (sourceId, index) {
        return 'outerCarrier_' + sourceId + '_' + index;
    },
    /**
     * 返回预定者的名字
     * @param roomName 目标外矿的房间名
     * @returns 预定者的名字
     */
    createOuterClaimerName: function (roomName) {
        return 'outerClaimer' + roomName;
    },
    /**
     * 检查是否需要产 creep，如果是，则生产 creep
     * @param spawn 目标 spawn
     * @param bornRoom 生成 creep 的房间
     */
    checkSpawnCreep: function (spawn, bornRoom) {
        // 找到所有名字中含有 outerSource 的旗子
        let flags = Object.keys(Game.flags).filter(key => key.includes('outerSource'));
        for (let i = 0; i < flags.length; ++i) {
            let flag = Game.flags[flags[i]];
            // 如果没有找到 flag ，则返回
            if (!flag) {
                return;
            }
            // 获取 flag 所在房间的对象
            let room = flag.room;
            // 如果没有找到房间对象，说明没有房间视野，则派出 scout 后返回
            if (!room) {
                this.scout(bornRoom, flags[i]);
                return;
            }
            if (this.delayHarvest(room)) {
                return;
            }
            // 获取 flag 房间内的所有 source 对象
            let sources = Game.rooms[flag.pos.roomName].find(FIND_SOURCES);
            // 遍历每个能量矿
            for (let source of sources) {
                // 获取能量矿的 id
                let sourceId = source.id;
                // 检查是否有足够数量的采矿 creep
                let outerHarvesters = _.filter(Game.creeps, i => i.memory.role == 'outerHarvester' && i.memory.sourceId == sourceId);
                if (outerHarvesters.length < 1) {
                    // 如果不够，则尝试生成一个新的采矿 creep
                    let name = this.createHarvesteName(sourceId);
                    let body = this.createHarvesterBody(bornRoom);
                    let memory = {
                        role: 'outerHarvester',
                        sourceId: source.id,
                        outerRoom: room.name,
                    };
                    // 生成一个新的采矿 creep
                    spawn.spawnCreep(body, name, {
                        memory: memory,
                        directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
                    });
                    // 返回，不再检查其他能量矿
                    return;
                }
                // 检查是否有足够数量的运输 creep
                let carriers = _.filter(Game.creeps, i => i.memory.role == 'outerCarrier' && i.memory.sourceId == sourceId);
                if (carriers.length < 1) {
                    // 如果不够，则尝试生成一个新的运输 creep
                    let index = carriers.length + 1;
                    let name = this.createCarrierName(sourceId, index);
                    let body = this.createCarrierBody(bornRoom);
                    let memory = {
                        role: 'outerCarrier',
                        sourceId: sourceId,
                        outerRoom: room.name,
                    };
                    // 生成一个新的运输 creep
                    spawn.spawnCreep(body, name, {
                        memory: memory,
                        directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
                    });
                    // 返回，不再检查其他能量矿
                    return;
                }
                // 控制器等级小于4没必要出预定者
                if (bornRoom.controller.level < 4) {
                    continue;
                }
                // 检查是否有预定者
                let claimer = _.find(Game.creeps, i => i.memory.role == 'outerClaimer'
                    && i.memory.outerRoom == room.name);
                // 如果没有，则生成一个
                if (claimer == undefined) {
                    let name = this.createOuterClaimerName(room.name);
                    let body = this.createOuterClaimerBody();
                    let memory = {
                        role: 'outerClaimer',
                        outerRoom: room.name,
                    };
                    // 生成一个新的预定者
                    spawn.spawnCreep(body, name, {
                        memory: memory,
                        directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
                    });
                    return;
                }
            }
        }
        return;
    },
    /**
     * 执行采矿爬行为
     * @param creep 目标采矿爬对象
     */
    runHarvester: function (creep) {
        let sourceId = creep.memory.sourceId;
        // 根据 id 获取能量矿对象
        let source = Game.getObjectById(sourceId);
        // 如果没有找到能量矿对象，说明没有房间视野，则向该房间移动
        if (!source) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.outerRoom));
            return;
        }
        // 尝试采集能量矿
        let result = creep.harvest(source);
        // 如果不在范围内，则向能量矿移动
        if (result == ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
        }
        return;
    },
    /**
     * 执行运输爬行为
     * @param creep 目标运输爬对象
     * @param room 将能量带回来的房间，即生产房
     */
    runCarrier: function (creep, room) {
        let sourceId = creep.memory.sourceId;
        // 根据 id 获取能量矿对象
        let source = Game.getObjectById(sourceId);
        // 如果没有找到能量矿对象，说明没有房间视野，则向 flag 移动
        if (!source) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.outerRoom));
            return;
        }
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
            // 在工作模式下，将能量运输回基地
            // 获取基地的 container 对象
            let container = _.filter(room.find(FIND_STRUCTURES), i => i.structureType == STRUCTURE_CONTAINER
                && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            // 获取最近的 container 对象
            let target = creep.pos.findClosestByRange(container);
            // 如果没有找到最近的对象，说明并不在基地房间里，则向基地移动
            if (target == null) {
                creep.moveTo(new RoomPosition(25, 25, room.name), {
                    reusePath: 20,
                    maxOps: 2000,
                });
                return;
            }
            // 尝试将能量转移给 container
            let result = creep.transfer(target, RESOURCE_ENERGY);
            // 如果不在范围内，则向 container 移动
            if (result == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        }
        else {
            // 在非工作模式下，从 container 或地上掉落的资源中获取能量
            // 获取能量矿旁边的 container 对象
            let container = source.pos.findInRange(FIND_STRUCTURES, 1, {
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
                creep.moveTo(source);
                return;
            }
            // 尝试从 container 中取出能量
            let result = 0;
            if (container) {
                result = creep.withdraw(container, RESOURCE_ENERGY);
                // 如果不在范围内，则向 container 移动
                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(container);
                }
            }
            else {
                result = creep.pickup(resource);
                // 如果不在范围内，则向 resource 移动
                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(resource);
                }
            }
        }
        return;
    },
    /**
     * 执行预定者任务
     * @param creep 预定者对象
     */
    runOuterClaimer: function (creep) {
        // 获取控制器对象
        let room = Game.rooms[creep.memory.outerRoom];
        let controller = room.controller;
        // 如果没有找到控制器对象，说明没有房间视野，则向该房间移动
        if (!controller) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.outerRoom), {
                maxOps: 1000,
                reusePath: 20,
            });
            return;
        }
        // 尝试预定控制器,若不够距离则移动至控制器
        if (creep.reserveController(controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(controller);
            return;
        }
        return;
    },
    /**
     * 执行 scout 行为，使其移动至目标房间获取房间视野
     * @param room 生产 scout 的房间对象
     */
    scout: function (room, flagName) {
        let flag = Game.flags[flagName];
        // 如果找不到旗子,则返回
        if (!flag) {
            return;
        }
        // 找到所有侦察兵
        let scout = _.find(Game.creeps, i => i.memory.role == "scout");
        // 若 scout 不存在,则新生产一个 scout
        if (scout == undefined) {
            let spawn = room.find(FIND_MY_SPAWNS)[0];
            spawn.spawnCreep([MOVE], "scout", {
                memory: { role: 'scout' },
                directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
            });
            return;
        }
        // 移动到旗子处
        scout.moveTo(flag.pos);
        return;
    },
    delayHarvest: function (room) {
        if (Memory.delayHarvest != undefined
            && Memory.delayHarvest.room == room.name) {
            return true;
        }
        // 若外矿房间内有敌对 creep, 则延迟采矿
        let enemy = room.find(FIND_HOSTILE_CREEPS)[0];
        if (enemy != undefined) {
            Memory.delayHarvest = { room: room.name, time: 1500 };
            return true;
        }
        return false;
    },
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
            && i.pos.findInRange(FIND_SOURCES, 2).length == 0);
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

const Builder = {
    run: function (builder, room) {
        if (MyMemory.upateWorking(builder, "energy")) {
            this.goBuild(builder, room);
        }
        else {
            Withdraw.energy(builder, room);
        }
    },
    goBuild: function (creep, room) {
        let sites = room.find(FIND_CONSTRUCTION_SITES);
        if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(sites[0]);
        }
        return;
    },
    // 当没有工地时，自动回去 recycle
    goRecycle: function (creep, room) {
        let sites = room.find(FIND_CONSTRUCTION_SITES);
        if (sites.length == 0) {
            let spawn = room.find(FIND_MY_SPAWNS)[0];
            if (spawn.recycleCreep(creep) == ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn);
            }
            return;
        }
    },
};

const SpawnCreep = {
    newList: [{}],
    newCreep: function (room) {
        let spawns = room.find(FIND_MY_SPAWNS);
        //if (this.recycle(room)) {
        //return;
        //}
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
            spawns[i].spawnCreep(this.newList[i].bodys, name, { memory: { role: this.newList[i].role },
                directions: [TOP_LEFT, LEFT, BOTTOM_LEFT],
            });
        }
        this.newList = [];
        return;
    },
};

const Build = {
    run: function (room) {
        let sites = room.find(FIND_CONSTRUCTION_SITES);
        let builders = _.filter(Game.creeps, (creep) => creep.memory.role
            == "builder");
        if (sites.length == 0) {
            for (let i = 0; i < builders.length; ++i) {
                Builder.goRecycle(builders[i], room);
            }
            return 0;
        }
        if (builders.length < 1) {
            let newListPush = {
                role: "builder",
                bodys: this.returnBodys(room),
            };
            SpawnCreep.newList.push(newListPush);
        }
        if (builders.length == 0) {
            return;
        }
        for (let i = 0; i < builders.length; ++i) {
            Builder.run(builders[i], room);
        }
        return;
    },
    returnBodys: function (room) {
        let energy = room.energyAvailable;
        let bodys = [WORK, CARRY, MOVE];
        const consume = 200;
        let times = (energy - consume) / consume;
        for (let i = 1; i < times; ++i) {
            bodys.push(WORK, CARRY, MOVE);
        }
        return bodys;
    }
};

const Tower = {
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
        if (enemy.find(i => i.owner.username == "PacifistBot") != undefined) {
            let controller = room.controller;
            controller.activateSafeMode();
            Game.notify("SF ON");
        }
        Tower.defend(room);
    }
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

const Harvester = {
    run: function (source, room, harvester) {
        if (this.transferExtension(harvester, room)) {
            return;
        }
        else {
            this.harvestEnergy(harvester, source, room);
        }
        return;
    },
    harvestEnergy: function (creep, target, room) {
        let resouces = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1).filter(i => i.resourceType == "energy");
        let tombstones = creep.pos.findInRange(FIND_TOMBSTONES, 1).filter(i => i.store["energy"] > 0);
        if (resouces.length != 0) {
            creep.pickup(resouces[0]);
        }
        else {
            if (tombstones.length != 0) {
                creep.withdraw(tombstones[0], "energy");
            }
        }
        if (creep.store.getFreeCapacity() < creep.getActiveBodyparts(WORK) * 4) {
            this.transferEnergy(creep, room);
            if (creep.store.getFreeCapacity() < creep.getActiveBodyparts(WORK)
                * 2) {
                this.transferEnergy(creep, room);
                return;
            }
        }
        if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
        return;
    },
    transferEnergy: function (creep, room) {
        let energy = creep.store["energy"];
        if (energy == 0) {
            return;
        }
        let sites = room.find(FIND_CONSTRUCTION_SITES);
        let site = creep.pos.findInRange(sites, 1)[0];
        if (site != undefined) {
            creep.build(site);
            return;
        }
        let extensions = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "extension"
            && i.store.getFreeCapacity("energy") > 0
            && creep.pos.getRangeTo(i) == 1);
        if (extensions[0] != undefined) {
            creep.transfer(extensions[0], "energy");
            return;
        }
        let link = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => i.structureType == "link")[0];
        if (link != undefined) {
            creep.transfer(link, "energy");
            return;
        }
        let containers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "container"
            && i.store.getFreeCapacity() > 0
            && creep.pos.getRangeTo(i) <= 1
            && i.pos.findInRange(FIND_MINERALS, 1).length == 0);
        if (containers[0] != undefined) {
            creep.transfer(containers[0], "energy");
            return;
        }
        let container = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => i.structureType == "container")[0];
        if (container != undefined || link != undefined) {
            return;
        }
        let spawn = room.find(FIND_MY_SPAWNS)[0];
        if (creep.transfer(spawn, "energy") == ERR_NOT_IN_RANGE) {
            creep.moveTo(spawn);
        }
        return;
    },
    transferExtension: function (creep, room) {
        if (creep.store["energy"] == creep.store.getCapacity()) {
            return false;
        }
        let containers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "container"
            && creep.pos.getRangeTo(i) <= 1);
        if (containers[0] == undefined || containers[0].store["energy"] == 0) {
            return false;
        }
        let extensions = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "extension"
            && i.store.getFreeCapacity("energy") > 0
            && creep.pos.getRangeTo(i) == 1);
        if (extensions[0] != undefined) {
            creep.withdraw(containers[0], "energy");
            return true;
        }
        let links = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "link"
            && i.store.getFreeCapacity("energy") > 0
            && creep.pos.getRangeTo(i) == 1);
        if (links[0] != undefined) {
            creep.withdraw(containers[0], "energy");
            return true;
        }
        return false;
    }
};

const Mineraler = {
    run: function (creep, room) {
        let mineral = room.find(FIND_MINERALS)[0];
        let container = mineral.pos.findInRange(room.find(FIND_STRUCTURES), 1).filter(i => i.structureType == "container")[0];
        if (creep.harvest(mineral) == ERR_NOT_IN_RANGE) {
            creep.moveTo(container);
        }
        if (creep.store.getCapacity() - creep.store.getUsedCapacity()
            < creep.getActiveBodyparts(WORK)) {
            let resource = Object.keys(creep.store)[0];
            let container = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => i.structureType == "container")[0];
            if (container != undefined) {
                creep.transfer(container, resource);
                return;
            }
            else if (room.storage != undefined) {
                if (creep.transfer(room.storage, resource) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(room.storage);
                }
                return;
            }
        }
        return;
    },
};

const Harvest = {
    run: function (room) {
        let sources = room.find(FIND_SOURCES);
        let harvesters = _.filter(room.find(FIND_MY_CREEPS), (creep) => creep.memory.role == "harvester");
        if (harvesters.length < sources.length) {
            let sourceId = sources[0].id;
            for (let i = 0; i < sources.length; ++i) {
                let id = sources[i].id;
                if (harvesters.find(creep => creep.name.indexOf(id) != -1)) {
                    continue;
                }
                else {
                    sourceId = id;
                    break;
                }
            }
            let newListPush = {
                role: "harvester",
                bodys: this.returnBodys(room, "harvester"),
                opt: sourceId,
            };
            SpawnCreep.newList.push(newListPush);
        }
        if (harvesters.length == 0) {
            return;
        }
        for (let i = 0; i < sources.length; ++i) {
            let id = sources[i].id;
            let harvester = harvesters.find(creep => creep.name.indexOf(id) != -1);
            if (harvester != undefined) {
                Harvester.run(sources[i], room, harvester);
            }
        }
        let extractor = _.find(room.find(FIND_STRUCTURES), i => i.structureType == "extractor");
        if (extractor == undefined) {
            return;
        }
        let mineraler = _.filter(room.find(FIND_MY_CREEPS), i => i.memory.role == "mineraler");
        if (mineraler.length < 1) {
            let mineral = room.find(FIND_MINERALS)[0];
            if (mineral == undefined || mineral.mineralAmount == 0) {
                return;
            }
            let newListPush = {
                role: "mineraler",
                bodys: this.returnBodys(room, "mineraler"),
            };
            SpawnCreep.newList.push(newListPush);
            return;
        }
        Mineraler.run(mineraler[0], room);
        return;
    },
    returnBodys: function (room, role) {
        let energy = room.energyAvailable;
        let bodys = [WORK, WORK, CARRY, MOVE];
        if (role == "mineraler") {
            for (let i = 0; i < 10; ++i) {
                bodys[i] = WORK;
            }
            bodys.push(CARRY, MOVE, MOVE, MOVE, MOVE, MOVE);
            return bodys;
        }
        if (energy < 300) {
            bodys = [WORK, CARRY, MOVE, MOVE];
            return bodys;
        }
        else if (energy >= 800) {
            bodys = [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE];
            return bodys;
        }
        const consume = 300;
        let times = Math.floor((energy - consume) / 250);
        for (let i = 0; i < times; ++i) {
            bodys.push(WORK, WORK, MOVE);
        }
        return bodys;
    },
};

const Labs = {
    runReaction: function (room) {
        let labs = _.filter(room.find(FIND_STRUCTURES), i => i.structureType == "lab");
        let noCdLab = _.find(labs, i => i.cooldown == 0);
        if (noCdLab == undefined) {
            return;
        }
        labs.splice(labs.indexOf(noCdLab), 1);
        noCdLab.runReaction(labs[0], labs[1]);
        return;
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
        let resouce = room.find(FIND_DROPPED_RESOURCES).filter(i => i.resourceType == "energy" && i.amount >= 500);
        let tombstone = room.find(FIND_TOMBSTONES).filter(i => i.store["energy"] >= 500);
        let containers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "container"
            && (i.store["energy"] >= amount || i.store["energy"] >= 500)
            && i.pos.findInRange(FIND_SOURCES, 2)[0] != undefined);
        let links = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "link"
            && i.store["energy"] >= 100
            && i.pos.findInRange(FIND_SOURCES, 2).length == 0);
        let targets = [...resouce, ...tombstone, ...containers, ...links];
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

const Link = {
    transferEnergy: function (room) {
        let links = _.filter(room.find(FIND_STRUCTURES), i => i.structureType == "link");
        let link = _.find(links, i => i.pos.findInRange(room.find(FIND_SOURCES), 2).length == 0);
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

const Spawns = {
    /**
     * 判断该房间是否有空闲的 spawn
     * @param room
     * @returns
     */
    isFreeSpawn: function (room) {
        let spawn = _.find(room.find(FIND_MY_SPAWNS), i => i.spawning == null);
        if (spawn == undefined) {
            return false;
        }
        else {
            return true;
        }
    },
};

const Transfer = {
    run: function (room, costs) {
        Link.transferEnergy(room);
        let carriers = _.filter(Game.creeps, (creep) => creep.memory.role
            == "carrier");
        if (carriers.length < 2) {
            this.newCarrier(room);
        }
        let transferTargets = _.filter(room.find(FIND_STRUCTURES), (i) => "store" in i
            && i.store["energy"] < i.store.getCapacity("energy") && (i.structureType == "spawn" || (i.structureType == "extension"
            && i.pos.findInRange(FIND_SOURCES, 2).length == 0)
            || i.structureType == "tower"
            || (i.structureType == "terminal" && i.store["energy"] < 50000)
            || i.structureType == "lab"
            || (i.structureType == "container"
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
                carrier.say(target.structureType);
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
        if (Spawns.isFreeSpawn(room) == false) {
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
        let bodys = [CARRY, CARRY, MOVE];
        if (energy <= 300) {
            bodys = [CARRY, MOVE];
        }
        const consume = 150;
        let times = (energy - consume) / 150;
        for (let i = 1; i < Math.trunc(times); ++i) {
            bodys.push(CARRY, CARRY, MOVE);
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
        let times = Math.floor((energy - consume) / 200);
        for (let i = 0; i < times; ++i) {
            bodys.push(WORK, CARRY, MOVE);
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
                    color: "green"
                });
            }
        }
        return;
    },
};

const Repair = {
    run: function (room) {
        let towers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "tower");
        if (towers.length > 0) {
            let structures = room.find(FIND_STRUCTURES).filter(i => i.hits < i.hitsMax
                && i.structureType != STRUCTURE_WALL
                && i.structureType != STRUCTURE_RAMPART
                || (i.structureType == STRUCTURE_RAMPART && i.hits < 1000));
            structures.sort((a, b) => a.hits - b.hits);
            for (let i = 0; i < structures.length && i < towers.length; ++i) {
                Tower.repair(structures[i], room);
            }
        }
        return;
    },
    returnBodys: function (room) {
        let energy = room.energyAvailable;
        let bodys = [WORK, CARRY, MOVE];
        if (energy < 300) {
            return bodys;
        }
        const consume = 200;
        let times = (energy - consume) / 200;
        for (let i = 0; i < Math.trunc(times); ++i) {
            bodys.push(WORK, CARRY, MOVE);
        }
        return bodys;
    },
};

const centerTransferer = {
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
        return;
    },
    /**
     * 返回中央运输爬的身体
     * @returns {BodyPartConstant[]} 运输爬的身体
     */
    createTransfererBody: function () {
        return [CARRY];
    },
    /**
     * 返回中央运输爬的名字
     * @returns {string} 运输爬的名字
     */
    createTransfererName: function () {
        return "centerTransferer" + Game.time;
    },
    /**
     * 检查是否需要生产新的中央运输爬
     * @param spawn 执行生产任务的 spawn
     * @param room 执行任务的房间
     */
    checkSpawnCreep: function (spawn, room) {
        let centerTransferer = _.filter(room.find(FIND_MY_CREEPS), i => i.memory.role == "centerTransferer");
        if (centerTransferer.length < 2) {
            let name = this.createTransfererName();
            let body = this.createTransfererBody();
            let memory = { role: 'centerTransferer' };
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
        if (creep.store.getFreeCapacity() > 0) {
            let targets = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => "store" in i
                && i.store[RESOURCE_ENERGY] > 0
                && (i.structureType == STRUCTURE_CONTAINER
                    || i.structureType == STRUCTURE_LINK
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
            if (level < 3) {
                FastUpgrade.run(room);
                Defend.run(room);
                return;
            }
            RoomVisual.run(roomName);
            let costs = this.roomCallBack(room);
            Harvest.run(room);
            centerTransferer.run(room);
            Transfer.run(room, costs);
            if (Build.run(room) == 0) {
                Upgrade.run(room, 1);
            }
            else {
                Upgrade.run(room);
            }
            Repair.run(room);
            Labs.runReaction(room);
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
    outerSource.run(room);
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
