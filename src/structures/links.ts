export const links = {
  transferEnergy: function (room: Room) {
    let links = _.filter(room.find(FIND_STRUCTURES), i => 
      i.structureType == "link" ) as StructureLink[];
    let link = _.find(links, i => 
      i.pos.findInRange(room.find(FIND_SOURCES), 2).length == 0
      && i.pos.getRangeTo(room.find(FIND_MY_SPAWNS)[0]) != 1
    );
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
}