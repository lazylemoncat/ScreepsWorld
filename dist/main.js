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

const Withdraw = {
    /**
     * 从容器中拿取energy
     * @param creep
     * @param room
     */
    energy: function (creep, room) {
        let amount = creep.store.getFreeCapacity();
        let containers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "container"
            && i.store["energy"] >= amount
            && i.pos.findInRange(FIND_SOURCES, 2)[0] != undefined);
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
            spawns[i].spawnCreep(this.newList[i].bodys, name, { memory: { role: this.newList[i].role } });
        }
        this.newList = [];
        return;
    },
    recycle: function (room) {
        if (room.controller != undefined && room.controller.level >= 5) {
            return false;
        }
        let recycler = _.filter(room.find(FIND_MY_CREEPS), i => i.memory.role == "recycler");
        if (recycler.length != 0) {
            let spawn = room.find(FIND_MY_SPAWNS).find(i => recycler[0].pos.getRangeTo(i) == 1);
            if (spawn != undefined) {
                spawn.recycleCreep(recycler[0]);
            }
        }
        let storage = room.storage;
        if (storage != undefined) {
            let free = storage.store.getFreeCapacity()
                / storage.store.getCapacity();
            if (free > 0.9) {
                return false;
            }
        }
        if (this.newList.length == 0) {
            let extensions = _.filter(room.find(FIND_STRUCTURES), i => i.structureType == "extension");
            if (extensions.find(i => i.store.getFreeCapacity("energy") > 0)) {
                return false;
            }
            room.find(FIND_MY_SPAWNS)[0].spawnCreep([WORK, WORK, MOVE], "recycler", {
                memory: { role: "recycler" },
                energyStructures: extensions,
            });
            return true;
        }
        return false;
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
        let extractor = _.filter(room.find(FIND_STRUCTURES), i => i.structureType == "extractor");
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
        let times = (energy - consume) / 250;
        for (let i = 1; i < times; ++i) {
            bodys.push(WORK, WORK, MOVE);
        }
        return bodys;
    },
};

const Repairer = {
    run: function (room) {
        let repairers = _.filter(Game.creeps, (creep) => creep.memory.role
            == "repairer");
        for (let i = 0; i < repairers.length; ++i) {
            let repairer = repairers[i];
            if (MyMemory.upateWorking(repairer, "energy")) {
                this.goRepair(repairer, room);
            }
            else {
                Withdraw.energy(repairer, room);
            }
        }
        return;
    },
    goRepair: function (creep, room) {
        if (creep.memory.repairTarget != undefined) {
            let target = Game.getObjectById(creep.memory.repairTarget);
            if (target == undefined) {
                creep.memory.repairTarget = undefined;
            }
            else if (target.hits == target.hitsMax) {
                creep.memory.repairTarget = undefined;
            }
            else {
                if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
                return;
            }
        }
        let structures = room.find(FIND_STRUCTURES).filter(i => i.structureType != STRUCTURE_WALL);
        let targets = structures.filter(i => i.hits < i.hitsMax);
        targets.sort((a, b) => a.hits - b.hits);
        if (targets[0] == undefined) {
            return;
        }
        creep.memory.repairTarget = targets[0].id;
        if (creep.repair(targets[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0]);
        }
        return;
    }
};

const Repair = {
    run: function (room) {
        let towers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "tower");
        if (towers.length > 0) {
            let structures = room.find(FIND_STRUCTURES).filter(i => i.hits < i.hitsMax && i.structureType != STRUCTURE_WALL);
            structures.sort((a, b) => a.hits - b.hits);
            if (structures[0] == undefined) {
                return;
            }
            for (let i = 0; i < structures.length; ++i) {
                Tower.repair(structures[i], room);
            }
            return;
        }
        let repairers = _.filter(Game.creeps, (creep) => creep.memory.role
            == "repairer" && creep.pos.roomName == room.name);
        if (repairers.length < 1) {
            let newListPush = {
                role: "repairer",
                bodys: this.returnBodys(room),
            };
            SpawnCreep.newList.push(newListPush);
        }
        if (repairers.length == 0) {
            return;
        }
        Repairer.run(room);
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
        for (let i = 1; i < Math.trunc(times); ++i) {
            bodys.push(WORK, CARRY, MOVE);
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
                creep.moveTo(room.storage, {
                    plainCost: 2,
                    swampCost: 10,
                    costCallback: function (roomName, CostMatrix) {
                        return costs;
                    }
                });
                return false;
            }
        }
        if (transfered || creep.transfer(target, resouceType)
            == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, {
                plainCost: 2,
                swampCost: 10,
                costCallback: function (roomName, CostMatrix) {
                    return costs;
                },
            });
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
                creep.moveTo(target, {
                    plainCost: 2,
                    swampCost: 10,
                    costCallback: function (roomName, CostMatrix) {
                        return costs;
                    }
                });
            }
            return;
        }
        else {
            if (creep.withdraw(target, "energy") == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {
                    costCallback: function (roomName, CostMatrix) {
                        return costs;
                    }
                });
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
            || i.structureType == "lab"));
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
                    if (target != room.storage && carrier.store["energy"] != 0) {
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
        let bodys = [WORK, WORK, CARRY, MOVE];
        if (energy <= 300) {
            bodys = [WORK, CARRY, MOVE];
            return bodys;
        }
        const consume = 300;
        let times = (energy - consume) / 250;
        for (let i = 1; i < times; ++i) {
            bodys.push(WORK, WORK, MOVE);
        }
        return bodys;
    },
};

const roomVisual = {
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

const RoomMaintain = {
    run: function () {
        for (let roomName in Game.rooms) {
            let room = Game.rooms[roomName];
            if (room.controller == undefined || !room.controller.my) {
                return;
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
            roomVisual.run(roomName);
            let costs = this.roomCallBack(room);
            Harvest.run(room);
            Transfer.run(room, costs);
            if (Build.run(room) == 0) {
                Upgrade.run(room, 3);
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

const loop = function () {
    // 运行市场的自动买卖
    global.Market.run();
    // 运行内存的管理
    MyMemory.run();
    // 运营每一个房间
    RoomMaintain.run();
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
