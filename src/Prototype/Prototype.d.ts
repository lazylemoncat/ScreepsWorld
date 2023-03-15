interface Creep {
  myMove(target: AnyStructure|Creep|Source|ConstructionSite|Mineral): void,
}