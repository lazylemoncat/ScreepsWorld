'use strict';

const MemoryRun = {
    run: function () {
        if (Memory.bornRoom == undefined || !(Memory.bornRoom in Game.rooms)) {
            this.reset();
        }
        if (Memory.creepsNum < Object.getOwnPropertyNames(Memory.creeps).length) {
            this.deleteCreep();
            Memory.creepsNum = Object.getOwnPropertyNames(Memory.creeps).length;
        }
    },
    reset: function () {
        if (Memory.bornRoom in Game.rooms) {
            return;
        }
        Memory.creepsNum = 0;
        Memory.rooms = {};
        Memory.spawns = {};
        Memory.creeps = {};
        Memory.bornRoom = Game.spawns.Spawn1.room.name;
    },
    deleteCreep: function () {
        for (let name in Memory.creeps) {
            if (!Game.creeps[name]) {
                let role = Memory.creeps[name].role;
                let roomName = Memory.creeps[name].room;
                let index = Memory.rooms[roomName][role + 's'].indexOf(name);
                Memory.rooms[roomName][role + 's'].splice(index, 1);
                delete Memory.creeps[name];
            }
        }
        return;
    },
};

Creep.prototype.myMove = function (target) {
    var _a;
    let path = [];
    if (this.memory.path != undefined && this.pos.isEqualTo(this.memory.path.lastPos.x, this.memory.path.lastPos.y)) {
        let path = this.pos.findPathTo(target);
        this.memory.path.path = Room.serializePath(path);
    }
    if (this.memory.path == undefined || this.memory.path.id != target.id) {
        path = this.pos.findPathTo(target, { ignoreCreeps: true });
        if (path.length == 0) {
            return;
        }
        if (target.pos.x != path[path.length - 1].x && target.pos.y != path[path.length - 1].y) {
            return;
        }
        this.memory.path = { path: Room.serializePath(path), id: target.id, lastPos: { x: 0, y: 0 } };
    }
    if (path.length == 0) {
        path = Room.deserializePath(this.memory.path.path);
    }
    let idx = path.findIndex(i => i.x == this.pos.x && i.y == this.pos.y);
    if (idx === -1) {
        let pos = new RoomPosition(path[0].x, path[0].y, this.room.name);
        if (!pos.isNearTo(this.pos)) {
            path = this.pos.findPathTo(target, { ignoreCreeps: true });
            this.memory.path = this.memory.path = { path: Room.serializePath(path), id: target.id, lastPos: { x: 0, y: 0 } };
        }
    }
    idx++;
    if (idx >= path.length) {
        this.memory.path == null;
        return;
    }
    let pos = new RoomPosition(path[idx].x, path[idx].y, this.room.name);
    // 简单的对穿
    if (pos.lookFor(LOOK_CREEPS).length != 0) {
        let creep = pos.lookFor(LOOK_CREEPS)[0];
        const roles = ['harvester', 'miner'];
        let role = creep.memory.role;
        if (roles.find(i => role == i) != undefined) {
            let path = this.pos.findPathTo(target);
            this.memory.path = { path: Room.serializePath(path), id: target.id, lastPos: { x: 0, y: 0 } };
            this.myMove(target);
            return;
        }
        let direction = undefined;
        if (((_a = creep.memory.path) === null || _a === void 0 ? void 0 : _a.nextPos) != undefined) {
            direction = creep.pos.getDirectionTo(creep.memory.path.nextPos.x, creep.memory.path.nextPos.y);
        }
        if (direction != undefined) {
            creep.move(direction);
        }
        else {
            creep.move(creep.pos.getDirectionTo(this.pos));
        }
    }
    this.move(this.pos.getDirectionTo(pos));
    this.memory.path.lastPos = { x: this.pos.x, y: this.pos.y };
    if (++idx < path.length) {
        this.memory.path.nextPos = { x: path[idx].x, y: path[idx].y };
    }
    return;
};

const spawn = {
    returnFreeSpawn: function (room) {
        let spawns = room.find(FIND_STRUCTURES).filter(i => i.structureType == STRUCTURE_SPAWN);
        let freeSpawns = [];
        for (let i = 0; i < spawns.length; i++) {
            let spawn = spawns[i];
            if (spawn.spawning != null) {
                spawn.memory.spawning = false;
                continue;
            }
            if (!spawn.memory.spawning) {
                freeSpawns.push(spawn);
            }
        }
        if (freeSpawns.length == 0) {
            return null;
        }
        else {
            return freeSpawns;
        }
    },
    spawnCreep(role, room, spawn) {
        let newName = role + Game.time;
        let resSpawn = -1;
        switch (role) {
            case 'harvester':
            case 'builder':
            case 'upgrader': {
                let index = returnFreeSource(role, room);
                let memory = { role: role, room: room.name, source: room.memory.sources[index] };
                let bodys = returnBodys(role, room.energyCapacityAvailable, room);
                resSpawn = spawn.spawnCreep(bodys, newName, { memory: memory });
                if (resSpawn == OK) {
                    spawn.memory.spawning = true;
                }
                break;
            }
            case 'repairer':
            case 'transferer': {
                let memory = { role: role, room: room.name };
                let bodys = returnBodys(role, room.energyCapacityAvailable, room);
                resSpawn = spawn.spawnCreep(bodys, newName, { memory: memory });
                if (resSpawn == OK) {
                    spawn.memory.spawning = true;
                }
                break;
            }
        }
        if (resSpawn == OK) {
            spawn.memory.spawning = true;
            room.memory[role + 's'].push(newName);
        }
        return;
    }
};
function returnBodys(role, capacity, room) {
    if (capacity == 300 || room.find(FIND_CREEPS).length < 4) {
        switch (role) {
            case 'harvester': return [WORK, CARRY, MOVE];
            case 'upgrader': return [WORK, CARRY, MOVE];
            case 'builder': return [WORK, CARRY, MOVE];
            case 'transferer': return [CARRY, CARRY, MOVE];
            case 'repairer': return [WORK, CARRY, MOVE];
        }
    }
    else {
        switch (role) {
            case 'harvester': {
                let bodys = [WORK, CARRY, MOVE];
                capacity /= 50;
                capacity -= 4;
                for (; capacity >= 5; capacity -= 5) {
                    bodys.push(WORK, WORK, MOVE);
                    if (bodys.length >= 9) {
                        break;
                    }
                }
                return bodys;
            }
            case 'upgrader': {
                let bodys = [];
                capacity /= 50;
                bodys.push(WORK, WORK, CARRY, MOVE);
                capacity -= 6;
                for (; capacity >= 5; capacity -= 5) {
                    bodys.push(WORK, WORK, MOVE);
                    if (bodys.length == 9)
                        break;
                }
                return bodys;
            }
            case 'builder': {
                let bodys = [];
                for (capacity /= 50; capacity >= 4; capacity -= 4) {
                    bodys.push(WORK, CARRY, MOVE);
                    if (bodys.length == 12)
                        break;
                }
                return bodys;
            }
            case 'transferer': {
                let bodys = [];
                for (capacity /= 50; capacity >= 2; capacity -= 2) {
                    bodys.push(MOVE, CARRY);
                    if (bodys.length == 12)
                        break;
                }
                return bodys;
            }
            case 'repairer': {
                let bodys = [];
                for (capacity /= 50; capacity >= 4; capacity -= 4) {
                    bodys.push(WORK, CARRY, MOVE);
                    if (bodys.length == 12)
                        break;
                }
                return bodys;
            }
            case 'claimer': {
                if (capacity >= 650) {
                    return [CLAIM, MOVE];
                }
                else {
                    return [];
                }
            }
        }
    }
    return [];
}
function returnFreeSource(role, room) {
    let index = 0;
    let creeps = room.memory[role + 's'];
    for (let i = 0; i < room.memory.sources.length; i++) {
        let source = Game.getObjectById(room.memory.sources[i]);
        for (let j = 0; j < creeps.length; j++) {
            let creep = Game.creeps[creeps[i]];
            if (creep == null) {
                continue;
            }
            if (source.id == creep.memory.source) {
                index = -1;
                continue;
            }
            else {
                index = i;
            }
        }
        if (index != -1) {
            break;
        }
        else {
            index = i + 1;
        }
    }
    return index == -1 ? 0 : index;
}

const build = {
    run: function (room) {
        for (let i = 0; i < room.memory.builders.length; i++) {
            let builder = Game.creeps[room.memory.builders[i]];
            if (builder == null) {
                Memory.creepsNum--;
                continue;
            }
            if (builder.memory.working && builder.store[RESOURCE_ENERGY] == 0) {
                builder.memory.working = false;
            }
            else if (!builder.memory.working && builder.store.getFreeCapacity('energy') == 0) {
                builder.memory.working = true;
            }
            if (builder.memory.working) {
                this.build(builder, room);
            }
            else {
                goGetEnergy$2(builder, room);
            }
        }
        return;
    },
    build: function (creep, room) {
        if (creep.memory.buildTarget == undefined || Game.getObjectById(creep.memory.buildTarget) == null) {
            let site = room.find(FIND_CONSTRUCTION_SITES)[0];
            creep.memory.buildTarget = site.id;
        }
        if (creep.memory.buildTarget == undefined) {
            return false;
        }
        let site = Game.getObjectById(creep.memory.buildTarget);
        if (site) {
            if (creep.build(site) == ERR_NOT_IN_RANGE) {
                creep.myMove(site);
            }
        }
        return true;
    },
};
function goGetEnergy$2(creep, room) {
    if (creep.memory.carrierTarget == undefined && !getCarrierTarget$2(creep, room)) {
        let source = Game.getObjectById(creep.memory.source);
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.myMove(source);
        }
        return;
    }
    let target = Game.getObjectById(creep.memory.carrierTarget.id);
    let creepNeed = creep.store.getFreeCapacity(RESOURCE_ENERGY);
    if (target == null || target.store['energy'] < creepNeed) {
        creep.memory.carrierTarget = undefined;
        return;
    }
    let res = creep.withdraw(target, 'energy');
    switch (res) {
        case ERR_NOT_IN_RANGE:
            creep.myMove(target);
            break;
        case OK:
            creep.memory.carrierTarget = undefined;
            break;
    }
    return;
}
function getCarrierTarget$2(creep, room) {
    let creepNeed = creep.store.getFreeCapacity(RESOURCE_ENERGY);
    if (room.storage != undefined && room.storage.store['energy'] >= creepNeed) {
        creep.memory.carrierTarget = { id: room.storage.id, type: 'energy' };
        return true;
    }
    let containers = room.find(FIND_STRUCTURES).
        filter(i => i.structureType == STRUCTURE_CONTAINER && i.store['energy'] >= creepNeed);
    if (containers.length > 0) {
        let container = creep.pos.findClosestByRange(containers);
        creep.memory.carrierTarget = { id: container.id, type: 'energy' };
        return true;
    }
    creep.memory.carrierTarget = undefined;
    return false;
}

const harvest = {
    run: function (room) {
        for (let i = 0; i < room.memory.harvesters.length; i++) {
            let harvester = Game.creeps[room.memory.harvesters[i]];
            if (harvester == null) {
                Memory.creepsNum--;
                continue;
            }
            let transfered = true;
            if (harvester.store.getFreeCapacity() < harvester.getActiveBodyparts(WORK) * 2) {
                transfered = this.transferEnergy(harvester, room);
            }
            this.goHarvest(harvester, transfered, room);
        }
        return;
    },
    goHarvest: function (creep, transfered, room) {
        if (!transfered) {
            return;
        }
        let source = Game.getObjectById(creep.memory.source);
        if (!this.harvestSource(room, creep)) {
            return;
        }
        if (creep.memory.container == undefined) {
            let container = source.pos.findInRange(FIND_STRUCTURES, 1).filter(i => i.structureType == STRUCTURE_CONTAINER)[0];
            if (container != null) {
                creep.memory.container = container.id;
            }
        }
        else {
            let container = Game.getObjectById(creep.memory.container);
            if (container != null) {
                if (!creep.pos.isEqualTo(container)) {
                    creep.myMove(container);
                }
            }
            if (container == null) {
                creep.memory.container = undefined;
            }
        }
        return;
    },
    harvestSource: function (room, creep) {
        if (creep.store.getFreeCapacity('energy') == 0) {
            return true;
        }
        if (creep.memory.source == undefined) {
            creep.memory.source = room.find(FIND_SOURCES)[0].id;
        }
        let source = Game.getObjectById(creep.memory.source);
        if (source.energy == 0) {
            source = room.find(FIND_SOURCES).filter(i => i.energy > 0)[0];
        }
        if (!creep.pos.isNearTo(source)) {
            creep.myMove(source);
            return false;
        }
        creep.harvest(source);
        return true;
    },
    transferEnergy: function (creep, room) {
        let source = Game.getObjectById(creep.memory.source);
        if (creep.memory.link == undefined) {
            let link = room.find(FIND_STRUCTURES).filter(i => i.pos.isNearTo(source) &&
                i.structureType == STRUCTURE_LINK)[0];
            if (link != undefined) {
                creep.memory.link = link.id;
            }
        }
        if (creep.memory.link != undefined) {
            let link = Game.getObjectById(creep.memory.link);
            let res = creep.transfer(link, 'energy');
            if (res == OK) {
                return true;
            }
            return false;
        }
        if (creep.memory.container != undefined) {
            let container = Game.getObjectById(creep.memory.container);
            let res = creep.transfer(container, 'energy');
            if (res == OK) {
                return true;
            }
            return false;
        }
        let spawn = room.find(FIND_MY_SPAWNS)[0];
        if (spawn.store.getFreeCapacity('energy') < creep.store['energy']) {
            if (build.build(creep, room)) {
                return false;
            }
        }
        if (creep.transfer(spawn, 'energy') == ERR_NOT_IN_RANGE) {
            creep.myMove(spawn);
        }
        return false;
    }
};

const tower = {
    repair: function (room) {
        let structures = room.find(FIND_STRUCTURES);
        let injureds = structures.filter(i => i.hits < i.hitsMax);
        injureds.sort((a, b) => a.hits - b.hits);
        let targets = injureds.filter(i => i.structureType != STRUCTURE_WALL && i.structureType != STRUCTURE_RAMPART);
        if (targets[0] == undefined) {
            targets = injureds;
        }
        for (let i = 0; i < room.memory.towers.length; ++i) {
            let tower = Game.getObjectById(room.memory.towers[i]);
            if (tower == null) {
                continue;
            }
            tower.repair(targets[0]);
        }
        return;
    }
};

const repair = {
    run: function (room) {
        if (Game.time % 100 == 0) {
            let towers = room.find(FIND_STRUCTURES).filter(i => i.structureType == STRUCTURE_TOWER);
            room.memory.towers = towers.map(i => i.id);
        }
        tower.repair(room);
        for (let i = 0; i < room.memory.repairers.length; i++) {
            let repairer = Game.creeps[room.memory.repairers[i]];
            if (repairer == null) {
                Memory.creepsNum--;
                continue;
            }
            if (repairer.memory.working && repairer.store[RESOURCE_ENERGY] == 0) {
                repairer.memory.working = false;
            }
            else if (!repairer.memory.working && repairer.store.getFreeCapacity() == 0) {
                repairer.memory.working = true;
            }
            if (repairer.memory.working) {
                goRepair(repairer, room);
            }
            else {
                goGetEnergy$1(repairer, room);
            }
        }
        return;
    }
};
function goRepair(creep, room) {
    let structures = room.find(FIND_STRUCTURES);
    let targets = structures.filter(i => i.hits < i.hitsMax);
    targets.sort((a, b) => a.hits - b.hits);
    if (room.memory.towers.length == 0) {
        targets = targets.filter(i => i.structureType != STRUCTURE_WALL && i.structureType != STRUCTURE_RAMPART);
    }
    else {
        targets = targets.filter(i => i.structureType == STRUCTURE_WALL || i.structureType == STRUCTURE_RAMPART);
    }
    if (targets[0] != undefined) {
        let target = creep.pos.findClosestByRange(targets);
        if (creep.repair(target) == ERR_NOT_IN_RANGE) {
            creep.myMove(target);
        }
    }
    return;
}
function goGetEnergy$1(creep, room) {
    if (creep.memory.carrierTarget == undefined && !getCarrierTarget$1(creep, room)) {
        let source = Game.getObjectById(creep.memory.source);
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.myMove(source);
        }
        return;
    }
    let target = Game.getObjectById(creep.memory.carrierTarget.id);
    let creepNeed = creep.store.getFreeCapacity(RESOURCE_ENERGY);
    if (target == null || target.store['energy'] < creepNeed) {
        creep.memory.carrierTarget = undefined;
        return;
    }
    let res = creep.withdraw(target, 'energy');
    switch (res) {
        case ERR_NOT_IN_RANGE:
            creep.myMove(target);
            break;
        case OK:
            creep.memory.carrierTarget = undefined;
            break;
    }
    return;
}
function getCarrierTarget$1(creep, room) {
    let creepNeed = creep.store.getFreeCapacity(RESOURCE_ENERGY);
    if (room.storage != undefined && room.storage.store['energy'] >= creepNeed) {
        creep.memory.carrierTarget = { id: room.storage.id, type: 'energy' };
        return true;
    }
    let containers = room.find(FIND_STRUCTURES).
        filter(i => i.structureType == STRUCTURE_CONTAINER && i.store['energy'] >= creepNeed);
    if (containers.length > 0) {
        let container = creep.pos.findClosestByRange(containers);
        creep.memory.carrierTarget = { id: container.id, type: 'energy' };
        return true;
    }
    creep.memory.carrierTarget = undefined;
    return false;
}

const sites = {
    run: function (room) {
        var _a;
        if (room.memory.sites.init == ((_a = room.controller) === null || _a === void 0 ? void 0 : _a.level)) {
            return;
        }
        switch (room.memory.sites.init + 1) {
            case 1: {
                if (this.sourceContainer(room) == true) {
                    room.memory.sites.init = 1;
                }
                break;
            }
        }
    },
    sourceContainer: function (room) {
        let sources = room.find(FIND_SOURCES);
        let containersNum = sources.length;
        let controller = room.controller;
        let containers = room.find(FIND_STRUCTURES).filter(i => i.structureType == STRUCTURE_CONTAINER);
        let spawnPos = room.find(FIND_STRUCTURES).filter(i => i.structureType == STRUCTURE_SPAWN)[0].pos;
        if (containers.length >= containersNum) {
            let path = room.findPath(spawnPos, controller.pos, { ignoreCreeps: true, ignoreRoads: true, swampCost: 1 });
            let pos = new RoomPosition(path[path.length - 3].x, path[path.length - 3].y, room.name);
            pos.createConstructionSite(STRUCTURE_CONTAINER);
            return true;
        }
        if (containers.length < containersNum) {
            for (let i = 0; i < sources.length; i++) {
                let container = sources[i].pos.findInRange(containers, 1)[0];
                let site = sources[i].pos.findInRange(FIND_CONSTRUCTION_SITES, 1).find(i => i.structureType == STRUCTURE_CONTAINER);
                if (container != undefined || site != undefined) {
                    continue;
                }
                let path = room.findPath(spawnPos, sources[i].pos, { ignoreCreeps: true, ignoreRoads: true, swampCost: 1 });
                let pos = new RoomPosition(path[path.length - 2].x, path[path.length - 2].y, room.name);
                pos.createConstructionSite(STRUCTURE_CONTAINER);
            }
        }
        return false;
    },
};

const transfer = {
    run: function (room) {
        for (let i = 0; i < room.memory.transferers.length; i++) {
            let transfer = Game.creeps[room.memory.transferers[i]];
            if (transfer == null) {
                Memory.creepsNum--;
                continue;
            }
            if (transfer.memory.working && transfer.store[RESOURCE_ENERGY] == 0) {
                transfer.memory.working = false;
            }
            else if (!transfer.memory.working && transfer.store.getFreeCapacity() == 0) {
                transfer.memory.working = true;
            }
            if (transfer.memory.working) {
                goTransfer(transfer, room);
            }
            else {
                goWithdraw(transfer, room);
            }
        }
        return;
    },
};
function goTransfer(creep, room) {
    let target = null;
    let carrierTarget = creep.memory.carrierTarget;
    if (carrierTarget != undefined) {
        target = Game.getObjectById(carrierTarget.id);
    }
    if (carrierTarget == undefined || target == null || target.store.getFreeCapacity(carrierTarget.type) == 0) {
        target = transferTarget(creep, room);
        if (target == undefined) {
            carrierTarget = undefined;
            return;
        }
        creep.memory.carrierTarget = { id: target.id, type: 'energy' };
    }
    if (target == null) {
        return;
    }
    let res = creep.transfer(target, 'energy');
    switch (res) {
        case ERR_NOT_IN_RANGE:
            creep.myMove(target);
            break;
        case OK: creep.memory.carrierTarget = undefined;
    }
    return;
}
function goWithdraw(creep, room) {
    let target = null;
    let carrierTarget = creep.memory.carrierTarget;
    if (carrierTarget != undefined) {
        target = Game.getObjectById(carrierTarget.id);
    }
    if (carrierTarget == undefined || target == null || target.store[carrierTarget.type] == 0) {
        target = withdrawTarget(creep, room);
        if (target == undefined) {
            carrierTarget = undefined;
            return;
        }
        creep.memory.carrierTarget = { id: target.id, type: 'energy' };
    }
    if (target == null) {
        return;
    }
    let res = creep.withdraw(target, 'energy');
    switch (res) {
        case ERR_NOT_IN_RANGE:
            creep.myMove(target);
            break;
        case OK: creep.memory.carrierTarget = undefined;
    }
    return;
}
function withdrawTarget(creep, room) {
    let creepNeed = creep.store.getFreeCapacity('energy');
    let structures = room.find(FIND_STRUCTURES);
    let links = structures.filter(i => i.structureType == STRUCTURE_LINK);
    if (links.length != 0 && room.storage != undefined) {
        let link = links.find(i => i.pos.isNearTo(room.storage));
        if (link != undefined && link.store['energy'] >= 100) {
            return link;
        }
    }
    let containers = structures.filter(i => i.structureType == STRUCTURE_CONTAINER &&
        i.pos.findInRange(FIND_SOURCES, 1).length != 0 && i.store['energy'] >= 50);
    if (containers.length != 0) {
        return containers[0];
    }
    let storage = room.storage;
    if (storage != undefined && storage.store['energy'] >= creepNeed) {
        return storage;
    }
    return null;
}
function transferTarget(creep, room) {
    let structures = room.find(FIND_STRUCTURES);
    let extensions = structures.filter(i => i.structureType == STRUCTURE_EXTENSION &&
        i.store.getFreeCapacity('energy') > 0);
    if (extensions.length > 0) {
        let extension = creep.pos.findClosestByRange(extensions);
        return extension;
    }
    let spawns = structures.filter(i => i.structureType == STRUCTURE_SPAWN &&
        i.store.getFreeCapacity('energy') > 0);
    if (spawns.length > 0) {
        return spawns[0];
    }
    let containers = structures.filter(i => i.structureType == STRUCTURE_CONTAINER &&
        i.pos.findInRange(FIND_SOURCES, 1).length == 0 &&
        i.pos.findInRange(FIND_MINERALS, 1).length == 0 &&
        i.store.getFreeCapacity('energy') > 0);
    if (containers.length > 0) {
        return containers[0];
    }
    if (room.storage != undefined) {
        return room.storage;
    }
    return null;
}

const upgrade = {
    run: function (room) {
        for (let i = 0; i < room.memory.upgraders.length; i++) {
            let upgrader = Game.creeps[room.memory.upgraders[i]];
            if (upgrader == null) {
                Memory.creepsNum--;
                continue;
            }
            if (upgrader.memory.working && upgrader.store[RESOURCE_ENERGY] == 0) {
                upgrader.memory.working = false;
            }
            else if (!upgrader.memory.working && upgrader.store.getFreeCapacity() == 0) {
                upgrader.memory.working = true;
            }
            if (upgrader.memory.working) {
                goUpgrade(upgrader, room);
            }
            else {
                goGetEnergy(upgrader, room);
            }
        }
    }
};
function goUpgrade(creep, room) {
    if (room.controller == undefined) {
        return;
    }
    creep.upgradeController(room.controller);
    creep.myMove(room.controller);
    return;
}
function goGetEnergy(creep, room) {
    if (creep.memory.carrierTarget == undefined && !getCarrierTarget(creep, room)) {
        let source = Game.getObjectById(creep.memory.source);
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.myMove(source);
        }
        return;
    }
    let target = Game.getObjectById(creep.memory.carrierTarget.id);
    let creepNeed = creep.store.getFreeCapacity(RESOURCE_ENERGY);
    if (target == null || target.store['energy'] < creepNeed) {
        creep.memory.carrierTarget = undefined;
        return;
    }
    let res = creep.withdraw(target, 'energy');
    switch (res) {
        case ERR_NOT_IN_RANGE:
            creep.myMove(target);
            break;
        case OK:
            creep.memory.carrierTarget = undefined;
            break;
    }
    return;
}
function getCarrierTarget(creep, room) {
    var _a, _b;
    let creepNeed = creep.store.getFreeCapacity(RESOURCE_ENERGY);
    let containers = room.find(FIND_STRUCTURES).
        filter(i => i.structureType == STRUCTURE_CONTAINER && i.store['energy'] >= creepNeed);
    if (((_a = room.controller) === null || _a === void 0 ? void 0 : _a.pos.findInRange(containers, 2).length) != 0) {
        let container = (_b = room.controller) === null || _b === void 0 ? void 0 : _b.pos.findInRange(containers, 2)[0];
        creep.memory.carrierTarget = { id: container.id, type: 'energy' };
        return true;
    }
    if (room.storage != undefined && room.storage.store['energy'] >= creepNeed) {
        creep.memory.carrierTarget = { id: room.storage.id, type: 'energy' };
        return true;
    }
    if (containers.length > 0) {
        let container = creep.pos.findClosestByRange(containers);
        creep.memory.carrierTarget = { id: container.id, type: 'energy' };
        return true;
    }
    creep.memory.carrierTarget = undefined;
    return false;
}

const roomMaintain = {
    run: function () {
        for (let name in Game.rooms) {
            let room = Game.rooms[name];
            if (room.controller == undefined || !room.controller.my) {
                continue;
            }
            initRoom(room);
            sites.run(room);
            newCreep(room);
            harvest.run(room);
            build.run(room);
            upgrade.run(room);
            transfer.run(room);
            repair.run(room);
        }
    }
};
function initRoom(room) {
    if (room.memory.isInit == true) {
        return;
    }
    room.memory.sources = room.find(FIND_SOURCES).map(i => i.id);
    room.memory.harvesters = [];
    room.memory.builders = [];
    room.memory.upgraders = [];
    room.memory.transferers = [];
    room.memory.repairers = [];
    room.memory.towers = [];
    room.memory.sites = { init: 0 };
    room.memory.isInit = true;
    return;
}
function newCreep(room) {
    let spawns = spawn.returnFreeSpawn(room);
    let index = 0;
    if (spawns == null) {
        return;
    }
    if (room.memory.harvesters.length < room.memory.sources.length) {
        for (let i = room.memory.harvesters.length; i < room.memory.sources.length; i++) {
            if (index == spawns.length) {
                return;
            }
            spawn.spawnCreep('harvester', room, spawns[index++]);
        }
    }
    let sites = room.find(FIND_CONSTRUCTION_SITES);
    if (sites.length > 0 && room.memory.builders.length < 2) {
        for (let i = room.memory.builders.length; i < 2; i++) {
            if (index == spawns.length) {
                return;
            }
            spawn.spawnCreep('builder', room, spawns[index++]);
        }
    }
    if (room.memory.upgraders.length < 2) {
        for (let i = room.memory.upgraders.length; i < (sites.length > 0 ? 1 : 2); i++) {
            if (index == spawns.length) {
                return;
            }
            spawn.spawnCreep('upgrader', room, spawns[index++]);
        }
    }
    let container = room.find(FIND_STRUCTURES).some(i => i.structureType == STRUCTURE_CONTAINER);
    if (container && room.memory.transferers.length < room.memory.sources.length) {
        for (let i = room.memory.transferers.length; i < room.memory.sources.length; i++) {
            if (index == spawns.length) {
                return;
            }
            spawn.spawnCreep('transferer', room, spawns[index++]);
        }
    }
    if (container && room.memory.repairers.length < 1) {
        for (let i = room.memory.repairers.length; i < 1; i++) {
            if (index == spawns.length) {
                return;
            }
            spawn.spawnCreep('repairer', room, spawns[index++]);
        }
    }
    return;
}

const loop = function () {
    if (Game.cpu.bucket == 10000 && Game.cpu.generatePixel) {
        Game.cpu.generatePixel();
    }
    MemoryRun.run();
    roomMaintain.run();
    return;
};

exports.loop = loop;
