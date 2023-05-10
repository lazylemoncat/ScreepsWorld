export const RoomVisual = {
  run: function (roomName: string) {
    this.upgrade(roomName);
    this.spawnCreep(roomName);
  },
  upgrade: function (roomName: string) {
    let room = Game.rooms[roomName];
    room.visual.text(roomName, 25,25, { align: "left"});
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
      room.visual.rect(27, 25.3, progress / 10, 1, {fill: "green"});
    }
    return;
  },
  spawnCreep: function (roomName: string) {
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
}