import Character from '../Character';

export default class Vampire extends Character {
  constructor(level = 1, type = 'vampire') {
    super(level, type);
    this.attack = 25;
    this.defence = 25;
    this.distance = 2;
    this.distanceAttack = 2;
  }
}