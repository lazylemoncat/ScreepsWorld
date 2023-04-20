declare var global: any;
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
}