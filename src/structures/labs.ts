export const labs = function(room: Room){
  const run = function () {
    let labId = Memory.rooms[room.name].labId;
    let substrateLabs = labId.substrateLabs.map(i => 
      Game.getObjectById(i as Id<StructureLab>)
    ) as StructureLab[];
    if (substrateLabs.length < 2) {
      return;
    }
    let reactionLabs = labId.reactionLabs.map(i => 
      Game.getObjectById(i as Id<StructureLab>)
    ) as StructureLab[];
    if (reactionLabs.length < 1) {
      return;
    }
    for (let i = 0; i < reactionLabs.length; ++i) {
      let res = 
        reactionLabs[i].runReaction(substrateLabs[0], substrateLabs[1]);
      if (res == 0) {
        Memory.rooms[room.name].labTask.amount -= 5;
      }
    }
    return;
  };
  run();
}