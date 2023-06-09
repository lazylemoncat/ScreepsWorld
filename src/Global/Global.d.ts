declare let global: {
  Market: {
    // 自动获得 pixel，以及完成未完成的订单任务
    run: () => void,
    // 购买资源
    buy: (kind: MarketResourceConstant, amount: number, room?: string) 
      => string,
    // 出售资源
    sell: (kind: MarketResourceConstant, amount: number, room?: string) 
    => string,
    // 创建一个订单
    createOrder: (type: "buy" | "sell", kind: MarketResourceConstant,
      price: number, totalAmount: number, room: string) => string,
    // 向其他房间发送资源
    send: (roomName: string, kind: ResourceConstant, amount: number,
      toRoom: string) => string,
    // 当 cpu 存款到10000时，自动获取一个 Pixel
    getPixel: () => void,
  };
  resetMemory: () => void,
  cancelAllOrder: () => 'OK',
  setStorageTask: () => void,
  setTerminalTask: () => void,
  setLabTask: () => void,
  setAutoSell: () => void,
  setOuterSource: (fromRoomName: string, toRoomName: string) => string,
  cancelOuterSource: (roomName: string) => string,
  consoleAvgWallHits: (roomName: string) => string,
  consoleAvgRampartHits: (roomName: string) => string,
  clearRoom: (fromRoomName: string, toRoomName: string) => void,
};