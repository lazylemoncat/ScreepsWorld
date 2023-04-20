import { PixelMarket } from "./PixelMarket"

export const Market = {
  run: function (): void {
    PixelMarket.generatePixel();

    return;
  },
  sell: function (): void {
    PixelMarket.sellPixel(50000);

    return;
  }
}