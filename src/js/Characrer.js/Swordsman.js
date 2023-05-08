import Character from "../Character";
export default class Swordsman extends Character {
  constructor(level) {
    super(level);
    this.attack = 40;
    this.defence = 10;
    this.health = 100;
    this.type = "swordsman";
    this.distance = 4;
    this.distanceAttack = 1;
  }
}