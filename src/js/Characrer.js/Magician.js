import Character from '../Character';

export default class Magician extends Character {
  constructor(level = 1, type = 'magician') {
    super(level, type);
    this.attack = 10;
    this.defence = 40;
    this.distance = 1;
    this.distanceAttack = 4;
  }
}