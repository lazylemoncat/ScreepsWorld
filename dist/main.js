'use strict';

const PixelMarket = {
    /**
     * 寻找所有卖价高于 pixelPrice 的订单并出售账户中 pixel 多于500的部分
     * @param pixelPrice
     */
    sellPixel: function (pixelPrice) {
        let pixels = Game.resources.pixel - 500;
        if (pixels <= 0) {
            return;
        }
        let pixelOrders = Game.market.getAllOrders({
            type: "buy",
            resourceType: "pixel",
        }).filter(order => order.price > pixelPrice);
        pixelOrders.sort((a, b) => b.price - a.price);
        pixels = pixels - pixelOrders[0].remainingAmount > 0
            ? pixelOrders[0].remainingAmount : pixels;
        Game.market.deal(pixelOrders[0].id, pixels);
    },
    /**
     * 当 cpu 存款到10000时，自动获取一个 Pixel
     */
    generatePixel: function () {
        if (Game.cpu.bucket == 10000 && Game.cpu.generatePixel) {
            Game.cpu.generatePixel();
        }
        return;
    }
};

const Market = {
    run: function () {
        PixelMarket.generatePixel();
        return;
    },
    sell: function () {
        PixelMarket.sellPixel(50000);
        return;
    }
};

const MyMemory = {
    run: function () {
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
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
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
};

const Carrier = {
    run: function (room) {
        let carriers = _.filter(Game.creeps, (creep) => creep.memory.role
            == "carrier");
        for (let i = 0; i < carriers.length; ++i) {
            let carrier = carriers[i];
            if (MyMemory.upateWorking(carrier, "energy")) {
                this.goTransfer(carrier, room);
            }
            else {
                this.goWithdrawEnergy(carrier, room);
            }
        }
        return;
    },
    goTransfer: function (creep, room) {
        const resouceType = Object.keys(creep.store)[0];
        creep.store[resouceType];
        if (resouceType != "energy") {
            // todo
            return;
        }
        let extensions = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "extension"
            && i.store.getFreeCapacity("energy") > 0);
        if (extensions[0] != undefined) {
            let extension = creep.pos.findClosestByRange(extensions);
            if (creep.transfer(extension, "energy") == ERR_NOT_IN_RANGE) {
                creep.moveTo(extension);
            }
            return;
        }
        let spawns = _.filter(room.find(FIND_MY_SPAWNS), (i) => i.structureType == "spawn"
            && i.store.getFreeCapacity("energy") > 0);
        if (spawns[0] != undefined) {
            if (creep.transfer(spawns[0], "energy") == ERR_NOT_IN_RANGE) {
                creep.moveTo(spawns[0]);
            }
            return;
        }
        let towers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "tower"
            && i.store.getFreeCapacity("energy") > 0);
        if (towers[0] != undefined) {
            if (creep.transfer(towers[0], "energy") == ERR_NOT_IN_RANGE) {
                creep.moveTo(towers[0]);
            }
            return;
        }
        let containers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "container"
            && i.store.getFreeCapacity("energy") > 0
            && i.pos.findInRange(FIND_SOURCES, 1)[0] == undefined
            && i.pos.findInRange(FIND_MINERALS, 1)[0] == undefined);
        if (containers[0] != undefined) {
            let container = creep.pos.findClosestByRange(containers);
            if (creep.transfer(container, "energy") == ERR_NOT_IN_RANGE) {
                creep.moveTo(container);
            }
            return;
        }
        return;
    },
    goWithdrawEnergy: function (creep, room) {
        let amount = creep.store.getFreeCapacity();
        let containers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "container"
            && i.store["energy"] >= amount
            && i.pos.findInRange(FIND_SOURCES, 1)[0] != undefined);
        if (containers[0] != undefined) {
            let container = creep.pos.findClosestByRange(containers);
            if (creep.withdraw(container, "energy") == ERR_NOT_IN_RANGE) {
                creep.moveTo(container);
            }
        }
        return;
    }
};

const Withdraw = {
    /**
     * 从容器中拿取energy
     * @param creep
     * @param room
     */
    energy: function (creep, room) {
        let energy = creep.store.getFreeCapacity();
        if (energy == 0) {
            return true;
        }
        let targets = _.filter(room.find(FIND_STRUCTURES), i => "store" in i
            && i.store["energy"] >= energy);
        let target = creep.pos.findClosestByRange(targets);
        if (target == undefined) {
            return false;
        }
        if (creep.withdraw(target, "energy") == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
            return false;
        }
        return true;
    }
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

const Roles = {
    run: function (room) {
        // Upgrader.run(room);
        Carrier.run(room);
        Repairer.run(room);
    }
};

const Builder = {
    run: function (target, builder, room) {
        if (MyMemory.upateWorking(builder, "energy")) {
            this.goBuild(builder, room);
        }
        else {
            Withdraw.energy(builder, room);
        }
    },
    goBuild: function (creep, room) {
        let sites = room.find(FIND_CONSTRUCTION_SITES);
        if (sites.length == 0) {
            return;
        }
        if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(sites[0]);
        }
        return;
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
            spawns[i].spawnCreep(this.newList[i].bodys, name, { memory: { role: this.newList[i].role } });
        }
        this.newList = [];
        return;
    },
};

const Build = {
    run: function (room) {
        let sites = room.find(FIND_CONSTRUCTION_SITES);
        if (sites.length == 0) {
            return 0;
        }
        let builders = _.filter(Game.creeps, (creep) => creep.memory.role
            == "builder");
        if (builders.length < 2) {
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
            Builder.run(sites[0], builders[i], room);
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
        Tower.defend(room);
    }
};

const Harvester = {
    run: function (source, room, harvester) {
        if (this.transferExtension(harvester, room)) {
            return;
        }
        this.harvestEnergy(harvester, source, room);
        return;
    },
    harvestEnergy: function (creep, target, room) {
        if (creep.store.getFreeCapacity() < creep.getActiveBodyparts(WORK) * 2) {
            this.transferEnergy(creep, room);
            return;
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
        let containers = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "container"
            && creep.pos.getRangeTo(i) <= 1);
        // TODO 添加传入link
        if (containers[0] != undefined) {
            creep.transfer(containers[0], "energy");
            return;
        }
        let container = creep.pos.findInRange(FIND_STRUCTURES, 1).filter(i => i.structureType == "container")[0];
        if (container != undefined) {
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
        if (containers[0] == undefined) {
            return false;
        }
        let extensions = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "extension"
            && i.store.getFreeCapacity("energy") > 0
            && creep.pos.getRangeTo(i) == 1);
        if (extensions[0] != undefined) {
            creep.withdraw(containers[0], "energy");
            return true;
        }
        return false;
    }
};

const Harvest = {
    run: function (room) {
        let sources = room.find(FIND_SOURCES);
        let harvesters = _.filter(room.find(FIND_MY_CREEPS), (creep) => creep.memory.role == "harvester");
        if (harvesters.length < sources.length) {
            let newListPush = {
                role: "harvester",
                bodys: this.returnBodys(room),
            };
            SpawnCreep.newList.push(newListPush);
        }
        if (harvesters.length == 0) {
            return;
        }
        for (let i = 0; i < sources.length; ++i) {
            let source = sources[i];
            if (harvesters[i] == undefined) {
                break;
            }
            Harvester.run(source, room, harvesters[i]);
        }
    },
    returnBodys: function (room) {
        let energy = room.energyAvailable;
        let bodys = [WORK, WORK, CARRY, MOVE];
        if (energy < 300) {
            bodys = [WORK, CARRY, MOVE, MOVE];
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

const Repair = {
    run: function (room) {
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
        let structures = room.find(FIND_STRUCTURES).filter(i => i.structureType != STRUCTURE_WALL);
        let targets = structures.filter(i => i.hits < i.hitsMax);
        targets.sort((a, b) => a.hits - b.hits);
        if (targets[0] == undefined) {
            return;
        }
        for (let i = 0; i < targets.length; ++i) {
            Tower.repair(targets[i], room);
        }
    },
    returnBodys: function (room) {
        let energy = room.energyAvailable;
        let bodys = [WORK, CARRY, MOVE];
        if (energy < 300) {
            return bodys;
        }
        const consume = 150;
        let times = (energy - consume) / 150;
        for (let i = 1; i < times; ++i) {
            bodys.push(WORK, CARRY, MOVE);
        }
        return bodys;
    },
};

const Transfer = {
    run: function (room) {
        let carriers = _.filter(Game.creeps, (creep) => creep.memory.role
            == "carrier");
        if (carriers.length < 2) {
            let container = _.filter(room.find(FIND_STRUCTURES), (i) => i.structureType == "container");
            if (container[0] == undefined) {
                return;
            }
            let newListPush = {
                role: "carrier",
                bodys: this.returnBodys(room),
            };
            SpawnCreep.newList.push(newListPush);
        }
        if (carriers.length == 0) {
            return;
        }
    },
    returnBodys: function (room) {
        let energy = room.energyAvailable;
        let bodys = [CARRY, MOVE];
        const consume = 100;
        let times = (energy - consume) / 100;
        for (let i = 1; i < times; ++i) {
            bodys.push(CARRY, MOVE);
        }
        return bodys;
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
        let energy = room.energyAvailable;
        let bodys = [WORK, WORK, CARRY, MOVE];
        if (energy < 300) {
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

const RoomMaintain = {
    run: function () {
        for (let roomName in Game.rooms) {
            let room = Game.rooms[roomName];
            Harvest.run(room);
            if (Build.run(room) == 0) {
                Upgrade.run(room, 3);
            }
            else {
                Upgrade.run(room);
            }
            Repair.run(room);
            Transfer.run(room);
            Defend.run(room);
        }
    },
};

global.newList = function () {
    console.log(SpawnCreep.newList.length);
    for (let i = 0; i < SpawnCreep.newList.length; ++i) {
        console.log(SpawnCreep.newList[i]);
    }
    return;
};

global.controller = function () {
    for (let roomName in Game.rooms) {
        console.log("............................................");
        console.log(roomName);
        let room = Game.rooms[roomName];
        let controller = room.controller;
        if (controller == undefined) {
            return "ERR_NOT EXIST";
        }
        let progress = (controller.progress / controller.progressTotal) * 100;
        console.log(controller.progress, controller.progressTotal);
        return progress + "%";
    }
};

global.structure = function (kind) {
    if (kind == "repair") {
        for (let roomName in Game.rooms) {
            console.log(roomName);
            console.log("............................................");
            let room = Game.rooms[roomName];
            let structures = room.find(FIND_STRUCTURES).filter(i => i.structureType != STRUCTURE_WALL);
            let targets = structures.filter(i => i.hits < i.hitsMax);
            targets.sort((a, b) => a.hits - b.hits);
            for (let i = 0; i < targets.length; ++i) {
                let target = targets[i];
                console.log(target.structureType, target.hits + '/' + target.hitsMax);
            }
        }
        return;
    }
};

const loop = function () {
    // 运行市场的买卖
    Market.run();
    // 运行内存的管理
    MyMemory.run();
    // 运营每一个房间
    RoomMaintain.run();
    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];
        SpawnCreep.newCreep(room);
        Roles.run(room);
    }
    return;
};

exports.loop = loop;
