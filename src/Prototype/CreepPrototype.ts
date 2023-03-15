Creep.prototype.myMove = function(target: AnyStructure|Creep|Source|ConstructionSite|Mineral) {
  let path: PathStep[] = [];
  if (this.memory.path != undefined && this.pos.isEqualTo(this.memory.path.lastPos.x, this.memory.path.lastPos.y)) {
    let path = this.pos.findPathTo(target);
    this.memory.path.path = Room.serializePath(path);
  }
  if (this.memory.path == undefined || this.memory.path.id != target.id) {
    path = this.pos.findPathTo(target, {ignoreCreeps: true});
    if (path.length == 0) {
      return;
    }
    if (target.pos.x != path[path.length - 1].x && target.pos.y != path[path.length - 1].y) {
      return;
    }
    this.memory.path = {path: Room.serializePath(path), id: target.id, lastPos: {x: 0, y: 0}};
  }
  if (path.length == 0) {
    path = Room.deserializePath(this.memory.path.path);
  }
  let idx = path.findIndex(i => i.x == this.pos.x && i.y == this.pos.y);
  if(idx === -1) {
    let pos = new RoomPosition(path[0].x, path[0].y, this.room.name);
    if(!pos.isNearTo(this.pos)) {
      path = this.pos.findPathTo(target, {ignoreCreeps: true});
      this.memory.path = this.memory.path = {path: Room.serializePath(path), id: target.id, lastPos: {x: 0, y: 0}};
    }
  }
  idx++;
  if(idx >= path.length) {
    this.memory.path = undefined;
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
      this.memory.path = {path: Room.serializePath(path), id: target.id, lastPos: {x: 0, y: 0}};
      this.myMove(target);
      return;
    }
    let direction: DirectionConstant|undefined = undefined;
    if (creep.memory.path?.nextPos != undefined) {
      if (creep.memory.path.nextPos.x != creep.pos.x && creep.memory.path.nextPos.y != creep.pos.y) {
        direction = creep.pos.getDirectionTo(creep.memory.path.nextPos.x, creep.memory.path.nextPos.y);
      }
    }
    if (direction != undefined) {
      creep.move(direction);
    } else {
      creep.move(creep.pos.getDirectionTo(this.pos));
    }
  }
  this.move(this.pos.getDirectionTo(pos));
  this.memory.path.lastPos = {x: this.pos.x, y: this.pos.y};
  if (++idx < path.length) {
    this.memory.path.nextPos = {x: path[idx].x, y: path[idx].y};
  }
  return;
}