import Character from '../Character';
export default class Daemon extends Character {
    constructor(level) {
        super(level);
        this.attack = 10;
        this.defence = 10;
        this.health = 100;
        this.type = 'daemon';
        this.distance = 1;
        this.distanceAttack = 4;
    }
}