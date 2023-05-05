export const Labs = {
  runReaction: function (room: Room) {
    let labs = _.filter(room.find(FIND_STRUCTURES), i => 
      i.structureType == "lab") as StructureLab[];
    let noCdLab = _.find(labs, i => i.cooldown == 0);
    if (noCdLab == undefined) {
      return;
    }
    labs.splice(labs.indexOf(noCdLab), 1);
    noCdLab.runReaction(labs[0], labs[1]);

    return;
  },
}