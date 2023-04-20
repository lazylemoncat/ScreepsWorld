export const AttackEvent = {
  getAttackerOwner: function () {
    // 查找针对我的 creep 和建筑的所有敌对行动
    for (let roomName in Game.rooms) {
      let room = Game.rooms[roomName];
      if (room.controller && room.controller.my) {
        let eventLog = room.getEventLog();
        let attackEvents = _.filter(eventLog, {event: EVENT_ATTACK});
        attackEvents.forEach(event => {
          if (event.data != null) {
            let data = event.data as {
              targetId: string;
              damage: number;
              attackType: EventAttackType;
            };
            let target = Game.getObjectById(data.targetId as Id<Creep>);
            if(target && target.my) {
              Game.notify(target.owner.username + "attack you");
              return;
            }
          }
        });
      }
    }
    return;
  },
}