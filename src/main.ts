import { MemoryRun } from './Memory/MemoryRun';
import './Prototype/CreepPrototype';
import { roomMaintain } from "./RoomMaintain/roomMaintain";

export const loop = function(): void {
  if(Game.cpu.bucket == 10000 && Game.cpu.generatePixel) {
    Game.cpu.generatePixel();
  }
  MemoryRun.run();
  roomMaintain.run();
  return;
}