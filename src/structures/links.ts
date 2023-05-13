export const links = function(room: Room) {
  const run = function (): void {
    let links = _.filter(room.find(FIND_STRUCTURES), i => 
      i.structureType == "link" ) as StructureLink[];
    let sourceLinks = _.filter(links, i => 
      i.pos.findInRange(room.find(FIND_SOURCES), 2).length != 0
    );
    if (sourceLinks.length == 0) {
      return;
    }
    let upgradeLink = _.find(links, i => 
      i.pos.getRangeTo(room.controller!) <= 3
    );
    let centerLink = _.find(links, i => 
      i.pos.getRangeTo(room.find(FIND_MY_SPAWNS)[0]) == 1
    );
    for (let i = 0; i < sourceLinks.length; ++i) {
      if (sourceLinks[i].store[RESOURCE_ENERGY] < 400) {
        continue;
      }
      if (upgradeLink && upgradeLink.store[RESOURCE_ENERGY] < 400) {
        sourceLinks[i].transferEnergy(upgradeLink);
      } else if (centerLink) {
        sourceLinks[i].transferEnergy(centerLink);
      }
    }
    if (centerLink && centerLink.store[RESOURCE_ENERGY] >= 400) {
      if (upgradeLink && upgradeLink.store[RESOURCE_ENERGY] < 400) {
        centerLink.transferEnergy(upgradeLink);
      }
    }
    return;
  };
  run();
}