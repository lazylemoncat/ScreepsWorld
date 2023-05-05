import { SpawnCreep } from "../spawnCreep";

export const MineralCarrier = {
  run: function (room: Room) {
    let extractor = _.find(room.find(FIND_STRUCTURES), i => 
                          i.structureType == "extractor");
    if (extractor == undefined) {
      return;
    }
    let creep = _.filter(room.find(FIND_MY_CREEPS), i => 
      i.memory.role == "mineralCarrier")[0];
    if (creep == undefined) {
      let newListPush = {
        role: "mineralCarrier",
        bodys: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
          CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
          MOVE, MOVE, MOVE,
          MOVE, MOVE, MOVE],
      }
      SpawnCreep.newList.push(newListPush);
      return;
    }
    if (room.terminal != undefined) {
      let store = _.filter(Object.keys(room.terminal.store), i => 
        i != "energy" && i != "LO")[0] as ResourceConstant;
      if (store != undefined) {
        if (creep.store.getCapacity() == creep.store.getUsedCapacity()) {
          let amount = creep.store[store];
          if (creep.transfer(room.storage!, store, amount) == ERR_NOT_IN_RANGE) {
            creep.moveTo(room.storage!);
          }
        } else if (creep.withdraw(room.terminal, store) == ERR_NOT_IN_RANGE) {
          creep.moveTo(room.terminal);
        }
        return;
      }
    }
    let container = room.find(FIND_MINERALS)[0].pos
      .findInRange(room.find(FIND_STRUCTURES), 1).filter(i => 
      i.structureType == "container")[0] as StructureContainer;
    if (container.store.getUsedCapacity() > 200) {
      let store = _.filter(Object.keys(container.store), i => 
        i != "energy")[0] as ResourceConstant;
      if (creep.store.getCapacity() == creep.store.getUsedCapacity()) {
        let store = Object.keys(creep.store)[0] as ResourceConstant;
        let amount = creep.store[store];
      if (creep.transfer(room.storage!, store, amount) == ERR_NOT_IN_RANGE) {
        creep.moveTo(room.storage!);
      }
        return;
      } else if (creep.withdraw(container, store) == ERR_NOT_IN_RANGE) {
        creep.moveTo(container);
      }
      return;
    }
    
    let labs = _.filter(room.find(FIND_STRUCTURES), i => 
      i.structureType == "lab") as StructureLab[];
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
    let store = Object.keys(noCdLab.store).find(i => 
      i != "energy" && i != "LO") as ResourceConstant;
    if (store != undefined) {
      if (creep.store.getUsedCapacity() > 0) {
        let store = Object.keys(creep.store)[0] as ResourceConstant;
        let amount = creep.store[store];
      if (creep.transfer(room.storage!, store, amount) == ERR_NOT_IN_RANGE) {
        creep.moveTo(room.storage!);
      }
        return;
      }
      if (creep.withdraw(noCdLab, store) == ERR_NOT_IN_RANGE) {
        creep.moveTo(noCdLab);
      }
      return;
    }

    if (labs[0].store["O"] <= 1000) {
      let store = Object.keys(labs[0].store).find(i => 
        i != "energy" && i != "O") as ResourceConstant;
      if (store != undefined) {
        if (creep.withdraw(labs[0], store) == ERR_NOT_IN_RANGE) {
          creep.moveTo(labs[0]);
        }
        return;
      }
      if (creep.store["O"] == 0) {
        if (creep.store.getUsedCapacity() == creep.store.getCapacity()) {
          let store = "O" as ResourceConstant;
          if (creep.transfer(room.storage!, store) == ERR_NOT_IN_RANGE) {
            creep.moveTo(room.storage!);
          }
          return;
        }
        if (creep.withdraw(room.storage!, "O") == ERR_NOT_IN_RANGE) {
          creep.moveTo(room.storage!);
        }
        return;
      }
      if (creep.transfer(labs[0], "O") == ERR_NOT_IN_RANGE) {
        creep.moveTo(labs[0]);
      }
      return;
    }

    if (labs[1].store["L"] <= 1000) {
      let store = Object.keys(labs[1].store).find(i => 
        i != "energy" && i != "L") as ResourceConstant;
      if (store != undefined) {
        if (creep.withdraw(labs[1], store) == ERR_NOT_IN_RANGE) {
          creep.moveTo(labs[1]);
        }
        return;
      }
      if (creep.store["L"] == 0) {
        if (creep.store.getUsedCapacity() == creep.store.getCapacity()) {
          let store = "L" as ResourceConstant;
          if (creep.transfer(room.storage!, store) == ERR_NOT_IN_RANGE) {
            creep.moveTo(room.storage!);
          }
          return;
        }
        if (creep.withdraw(room.storage!, "L") == ERR_NOT_IN_RANGE) {
          creep.moveTo(room.storage!);
        }
        return;
      }
      if (creep.transfer(labs[1], "L") == ERR_NOT_IN_RANGE) {
        creep.moveTo(labs[1]);
      }
      return;
    }

    if (room.terminal != undefined) {
      if (room.terminal?.store["LO"] < 10000) {
        let storage = room.storage!;
        if (creep.store["LO"] == 0) {
          if (creep.store.getUsedCapacity() 
          == creep.store.getCapacity()) {
            let store = Object.keys(creep.store)[0] as ResourceConstant;
            let amount = creep.store[store];
            if (creep.transfer(room.storage!, store, amount) 
              == ERR_NOT_IN_RANGE) {
              creep.moveTo(storage);
            }
            return;
          } else if (creep.withdraw(storage, "LO") == ERR_NOT_IN_RANGE) {
            creep.moveTo(storage);
          }
          return;
        } else {
          if (creep.transfer(room.terminal, "LO") == ERR_NOT_IN_RANGE) {
            creep.moveTo(room.terminal);
          }
          return;
        }
      }
    }

    if (creep.store.getUsedCapacity() > 0) {
      let store = Object.keys(creep.store)[0] as ResourceConstant;
      let amount = creep.store[store];
      if (creep.transfer(room.storage!, store, amount) == ERR_NOT_IN_RANGE) {
        creep.moveTo(room.storage!);
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
}