import { SpawnCreep } from "@/Tasks/SpawnCreep";
declare var global: any;
global.newList = function() {
  console.log(SpawnCreep.newList.length);
  for (let i = 0; i < SpawnCreep.newList.length; ++i) {
    console.log(SpawnCreep.newList[i]);
  }
  return;
}