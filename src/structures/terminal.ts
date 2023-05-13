export const terminal = function(room: Room) {
  const autoBuy = function() {
    if (!room.terminal) {
      return;
    }
    if (Game.time % 10 != 0) {
      return;
    }
    let storageTask = Memory.rooms[room.name].storageTask;
    let resources = Object.keys(storageTask) as ResourceConstant[];
    let storage = room.storage!;
    for (let i = 0; i < resources.length; ++i) {
      let terminalResource = room.terminal.store[resources[i]]
        - Memory.rooms[room.name].terminalTask[resources[i]];
      let storageResource = storage.store[resources[i]];
      let del = storageTask[resources[i]] - terminalResource 
        - storageResource;
      if (del <= 0) {
        continue;
      }
      let orders = Game.market.getAllOrders(
        {
          type: ORDER_BUY, 
          resourceType: resources[i] as ResourceConstant,
        }
      );
      orders.sort((a, b) => b.price - a.price);
      if (orders[0] == undefined) {
        continue;
      }
      if (orders[0].roomName && orders[0].roomName in Game.rooms) {
        return false;
      }
      let price = orders[0].price + 0.1;
      let yesterdayOrders = Game.market.getHistory(resources[i])[
        Game.market.getHistory(resources[i]).length - 1
      ];
      if (price > yesterdayOrders.avgPrice + yesterdayOrders.stddevPrice) {
        return;
      }
      let order = Object.keys(Game.market.orders).find(key =>
        Game.market.orders[key].resourceType == resources[i]
        && Game.market.orders[key].type == ORDER_BUY
        && Game.market.orders[key].roomName == room.name
      );
      if (order != undefined) {
        Game.market.changeOrderPrice(order, price);
        let remainingAmount = Game.market.orders[order].remainingAmount;
        Game.market.extendOrder(order, del - remainingAmount)
        return;
      }
      Game.market.createOrder({
        type: ORDER_BUY,
        resourceType: resources[i],
        roomName: room.name,
        price: price,
        totalAmount: del,
      });
      return;
    }
    return;
  };
  const autoSell = function() {
    if (!room.terminal) {
      return;
    }
    if (Game.time % 1000 != 0) {
      return;
    }
    let autoSell = Memory.rooms[room.name].autoSell;
    let terminal = room.terminal;
    let storage = room.storage!;
    let resource = _.find(Object.keys(autoSell), (i: ResourceConstant) => 
      terminal.store[i] >= autoSell[i]
      && storage.store[i] * 2 >= autoSell[i]
    ) as ResourceConstant | undefined;
    if (!resource) {
      return;
    }
    let orders = Game.market.getAllOrders(
      {
        type: ORDER_SELL, 
        resourceType: resource,
      }
    );
    orders.sort((a, b) => a.price - b.price);
    if (orders[0].roomName && orders[0].roomName in Game.rooms) {
      return;
    }
    let price = orders[0].price - 0.1;
    let yesterdayOrders = Game.market.getHistory(resource)[
      Game.market.getHistory(resource).length - 1
    ];
    if (price < yesterdayOrders.avgPrice - yesterdayOrders.stddevPrice) {
      return;
    }
    let order = Object.keys(Game.market.orders).find(i =>
      Game.market.orders[i].resourceType == resource
      && Game.market.orders[i].type == ORDER_SELL
      && Game.market.orders[i].roomName == room.name
    );
    if (order != undefined) {
      Game.market.changeOrderPrice(order, price);
      let remainingAmount = Game.market.orders[order].remainingAmount;
      Game.market.extendOrder(order, autoSell[resource] - remainingAmount)
      return;
    }
    Game.market.createOrder({
      type: ORDER_SELL,
      resourceType: resource,
      roomName: room.name,
      price: price,
      totalAmount: autoSell[resource],
    });
    return;
  };
  autoBuy()
  autoSell();
  return;
}