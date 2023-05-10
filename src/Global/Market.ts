global.Market = {
  run: function (): void {
    // 当有未完成的购买订单时，继续购买
    if (Memory.Market != undefined) {
      if (Memory.Market.buy == true) {
        let order = Memory.Market;
        this.buy(order.kind, order.amount, order.room);
      }
    }
    // 获得像素
    this.getPixel();
    return;
  },
  buy: function (kind: MarketResourceConstant, amount: number, room?: string) {
    let orders = Game.market.getAllOrders({
      type: "sell",
      resourceType: kind,
    });
    // 价格从低到高排列
    orders.sort((a, b) => a.price - b.price);
    if (orders[0] == undefined) {
      return "ORDERS_NOT_EXIST";
    }
    for (let i = 0; amount > 0 && i <= 10; ++i) {
      // 当执行订单达到该 tick 的限制时，将任务存入内存延缓执行
      if (i == 10) {
        if (room == undefined) {
          Memory.Market = {
            buy: true,
            kind: kind,
            amount: amount,
          };
          return "WILL_BE_SOON";
        }
        Memory.Market = {
          buy: true,
          kind: kind,
          amount: amount,
          room: room
        };
        return "WILL_BE_SOON";
      }
      let dealAmount = amount - orders[i].amount > 0 
        ? orders[i].amount : amount;
      let res = 0;
      if (room == undefined) {
        res = Game.market.deal(orders[i].id, dealAmount);
      } else {
        res = Game.market.deal(orders[i].id, dealAmount, room);
      }
      if (res != 0) {
        return "ERR" + res;
      }
      amount -= dealAmount;
    }
    Memory.Market = undefined;
    return "DEAL";
  },
  sell: function (kind: MarketResourceConstant, 
    amount: number, room?: string) {
    let orders = Game.market.getAllOrders({
      type: "buy",
      resourceType: kind,
    });
    // 价格从高到低排列
    orders.sort((a, b) => b.price - a.price);
    if (orders[0] == undefined) {
      return "ORDERS_NOT_EXIST";
    }
    for (let i = 0; amount > 0 && i <= 10; ++i) {
      // 当执行订单达到该 tick 的限制时，将任务存入内存延缓执行
      if (i == 10) {
        if (room == undefined) {
          Memory.Market = {
            buy: false,
            kind: kind,
            amount: amount,
          };
          return "WILL_BE_SOON";
        }
        Memory.Market = {
          buy: false,
          kind: kind,
          amount: amount,
          room: room
        };
        return "WILL_BE_SOON";
      }
      let dealAmount = amount - orders[i].amount > 0 
        ? orders[i].amount : amount;
      let res = 0;
      if (room == undefined) {
        res = Game.market.deal(orders[i].id, dealAmount);
      } else {
        res = Game.market.deal(orders[i].id, dealAmount, room);
      }
      if (res != 0) {
        return "ERR" + res;
      }
      amount -= dealAmount;
    }
    Memory.Market = undefined;
    return "DEAL";
  },
  createOrder: function (type: "buy" | "sell", kind: MarketResourceConstant,
    price: number, totalAmount: number, room: string) {
    let res = Game.market.createOrder({
      type: type,
      resourceType: kind,
      price: price,
      totalAmount: totalAmount,
      roomName: room   
    });
    if (res != 0) {
      return "ERR" + res;
    }
    return "OK";
  },
  send: function (roomName: string, kind: ResourceConstant, amount: number,
    toRoom: string) {
    let room = Game.rooms[roomName];
    if (room.terminal == undefined) {
      return "TERMINAL_NOT_EXIST";
    }
    let res = room.terminal.send(kind, amount, toRoom);
    if (res != 0) {
      return "ERR" + res;
    }
    return "OK";
  },
  getPixel() {
    if (Game.cpu.bucket == 10000 && Game.cpu.generatePixel) {
      Game.cpu.generatePixel();
    }
    return;
  },
}