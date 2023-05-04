import Character from '../Character';

export default class Daemon extends Character {
  constructor(level = 1, type = 'daemon') {
    super(level, type);
    this.attack = 10;
    this.defence = 40;
    this.distance = 1;
    this.distanceAttack = 4;
  }
}