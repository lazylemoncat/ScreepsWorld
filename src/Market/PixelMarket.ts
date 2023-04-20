export const PixelMarket = {
  /**
   * 寻找所有卖价高于 pixelPrice 的订单并出售账户中 pixel 多于500的部分
   * @param pixelPrice
   */
  sellPixel: function (pixelPrice: number): void {
    let pixels = Game.resources.pixel - 500;
    if (pixels <= 0) {
      return;
    }
    let pixelOrders = Game.market.getAllOrders({
      type: "buy",
      resourceType: "pixel",
    }).filter(order => order.price > pixelPrice);
    pixelOrders.sort((a, b) => b.price - a.price);

    pixels = pixels - pixelOrders[0].remainingAmount > 0 
      ? pixelOrders[0].remainingAmount : pixels;
    Game.market.deal(pixelOrders[0].id, pixels);
  },
  /**
   * 当 cpu 存款到10000时，自动获取一个 Pixel
   */
  generatePixel: function (): void {
    if (Game.cpu.bucket == 10000 && Game.cpu.generatePixel) {
      Game.cpu.generatePixel();
    }

    return;
  }
}