export const outer = {
  run: function() {
    if (Memory.outer == undefined) {
      init();
    }
    if (Game.flags.appendOuter != undefined) {
      
    }
    if (Memory.outer.roomsNum == 0) {
      return;
    }
  }
}

function init() {
  Memory.outer.rooms = [];
  Memory.outer.roomsNum = 0;
  Memory.outer.init = true;
}