/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-param-reassign */
import themes from './themes';
import cursors from './cursors';
import GamePlay from './GamePlay';
import { tooltip } from './utils';
import GameState from './GameState';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';
import Bowman from './Characters/Bowman';
import Daemon from './Characters/Daemon';
import Undead from './Characters/Undead';
import Vampire from './Characters/Vampire';
import Magician from './Characters/Magician';
import Swordsman from './Characters/Swordsman';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.sides = {
      player: {
        name: 'player', first: 0, second: 1, characters: [Swordsman, Bowman, Magician],
      },
      enemy: {
        name: 'enemy', first: this.gamePlay.boardSize - 1, second: this.gamePlay.boardSize - 2, characters: [Undead, Vampire, Daemon],
      },
    };
    this.level = 1;
    this.score = 0;
    this.attacks = [];
    this.statuses = {
      freespace: 'free space',
      enemy: 'enemy',
      allied: 'allied',
      notallowed: 'notallowed',
    };
    this.movements = [];
    this.selected = null;
    this.currentStatus = null;
    this.positionsToDraw = [];
    this.area = this.getRowArray();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      const loaded = JSON.parse(sessionStorage.getItem('reload'));

      if (loaded) {
        this.loadState(loaded);
      } else {
        this.theme = themes.prairie;
        this.gamePlay.drawUi(this.theme);
      }
    });
    // TODO: add event listeners to gamePlay events
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addEscListener(this.onEsc.bind(this));

    // TODO: load saved stated from stateService
    this.gamePlay.addNewGameListener(this.newGame.bind(this, this.level, this.theme));
    this.gamePlay.addSaveGameListener(this.saveGame.bind(this));
    this.gamePlay.addLoadGameListener(this.loadGame.bind(this));

    window.addEventListener('unload', () => {
      sessionStorage.setItem('reload', JSON.stringify(GameState.from(this)));
    });
  }

  positions() {
    const positions = [];
    for (let i = 0; i < this.gamePlay.boardSize ** 2; i += 1) {
      positions.push(i);
    }
    return { array: positions, lineLength: this.gamePlay.boardSize, length: positions.length };
  }

  sidePositions(side) {
    const field = this.positions();
    return field.array.filter((item) => (item % field.lineLength === side.first)
      || (item % field.lineLength === side.second)).map((item) => item);
  }

  newGame(level = 1, theme = themes.prairie) {
    this.level = level;
    this.gamePlay.deselectAll();
    this.selected = null;
    this.theme = theme;
    this.gamePlay.drawUi(this.theme);

    if (level === 1) {
      this.positionsToDraw = [];
    }

    const player = this.sidePositions(this.sides.player);
    const enemy = this.sidePositions(this.sides.enemy);

    function getPosition(side) {
      const index = Math.floor(Math.random() * side.length);
      const cell = side[index];
      side.splice(index, 1);
      return cell;
    }

    if (!this.positionsToDraw.length) {
      const playerTeam = generateTeam([Swordsman, Bowman], level, 2);
      const enemyTeam = generateTeam(this.sides.enemy.characters, level, 2);
      this.positionsToDraw = [playerTeam
        .map((item) => new PositionedCharacter(item, this.sides.player.name, getPosition(player))),
      enemyTeam
        .map((item) => new PositionedCharacter(item, this.sides.enemy.name, getPosition(enemy))),
      ].flat();
    } else {
      // Возвращаем оставшихся на исходные позиции
      this.positionsToDraw.forEach((hero) => { hero.position = getPosition(player); });
      // Убираем уже занятые клетки из массива возможных для позиционирования
      const playerFiltered = this.sidePositions(this.sides.player)
        .filter((cell) => !this.positionsToDraw.find((hero) => hero.position === cell));
      const survivorsPlayer = this.positionsToDraw.length;
      let playerTeam;

      if (level === 2) {
        playerTeam = generateTeam(this.sides.player.characters, level - 1, 1);
      }

      if (level === 3 || level === 4) {
        playerTeam = generateTeam(this.sides.player.characters, level - 1, 2);
      }

      const enemyTeam = generateTeam(this.sides.enemy.characters,
        level, playerTeam.length + survivorsPlayer);
      this.positionsToDraw.push(playerTeam
        .map((item) => new PositionedCharacter(item, this.sides.player.name,
          getPosition(playerFiltered))));
      this.positionsToDraw.push(enemyTeam
        .map((item) => new PositionedCharacter(item, this.sides.enemy.name, getPosition(enemy))));
      this.positionsToDraw = this.positionsToDraw.flat();
    }
    this.gamePlay.redrawPositions(this.positionsToDraw);
  }

  saveGame() {
    if (!this.positionsToDraw.length) {
      GamePlay.showError('ВНИМАНИЕ! Нет игры для сохранения!');
    } else {
      const state = GameState.from(this);
      this.stateService.save(state);
      GamePlay.showMessage('Игра успешно сохранена!');
    }
  }

  loadGame() {
    const state = this.stateService.load();

    if (!state) {
      GamePlay.showError('ВНИМАНИЕ! Нет игры для загрузки!');
    } else {
      this.loadState(state);
      GamePlay.showMessage('Игра успешно загружена!');
    }
  }

  loadState(load) {
    this.gamePlay.deselectAll();
    this.selected = null;
    const {
      level, positions, theme, score,
    } = load;
    this.level = level;
    this.positionsToDraw = positions;
    this.theme = theme;
    this.score = score;
    this.gamePlay.drawUi(this.theme);
    this.gamePlay.redrawPositions(this.positionsToDraw);
  }

  onEsc() {
    this.clear();
    this.score = 0;
    this.gamePlay.drawUi(this.theme);
  }

  clear() {
    this.level = 1;
    this.positionsToDraw = [];
    this.selected = null;
    this.theme = themes.prairie;
  }

  levelUp() {
    this.level += 1;
    this.positionsToDraw.forEach((hero) => {
      hero.character.level = this.level;
      hero.character.attack = Math.ceil(Math.max(hero.character.attack, hero.character.attack
        * (1.8 - (hero.character.health === 1 ? 80 : hero.character.health) / 100)));
      hero.character.defence = Math.ceil(Math.max(hero.character.defence, hero.character.defence
        * (1.8 - (hero.character.health === 1 ? 80 : hero.character.health) / 100)));
      hero.character.health = Math.ceil(hero.character.health + 80 > 100
        ? 100 : hero.character.health + 80);
    });
    switch (this.level) {
      case 2:
        this.gamePlay.drawUi(themes.desert);
        this.theme = themes.desert;
        break;
      case 3:
        this.gamePlay.drawUi(themes.arctic);
        this.theme = themes.arctic;
        break;
      case 4:
        this.gamePlay.drawUi(themes.mountain);
        this.theme = themes.mountain;
        break;
      default:
        this.gamePlay.drawUi(themes.prairie);
        this.theme = themes.prairie;
        break;
    }
    return this.level;
  }

  getRowArray() {
    const area = [];
    let rowArr = [];
    for (let i = 0; i < this.gamePlay.boardSize ** 2; i += 1) {
      rowArr.push(i);
      if (rowArr.length === this.gamePlay.boardSize) {
        area.push(rowArr);
        rowArr = [];
      }
    }
    return area;
  }

  getAreaMove(currentPosition, distance) {
    const { boardSize } = this.gamePlay;
    const x = currentPosition.position % boardSize;
    const y = Math.floor(currentPosition.position / boardSize);
    const areaMove = [];
    for (let i = 1; i <= distance; i += 1) {
      // Движемся вправо
      let xFree = x + i;
      if (xFree < boardSize) {
        areaMove.push(this.area[y][xFree]);
      }
      // Движемся вниз
      let yFree = y + i;
      if (yFree < boardSize) {
        areaMove.push(this.area[yFree][x]);
      }
      // Движемся по диагонали вправо и вниз
      if ((yFree < boardSize) && (xFree < boardSize)) {
        areaMove.push(this.area[yFree][xFree]);
      }
      // Движемся влево
      xFree = x - i;
      if (xFree >= 0) {
        areaMove.push(this.area[y][xFree]);
      }
      // Движемся по диагонали влево и вниз
      if ((xFree >= 0) && (yFree < boardSize)) {
        areaMove.push(this.area[yFree][xFree]);
      }
      // Движемся вверх
      yFree = y - i;
      if (yFree >= 0) {
        areaMove.push(this.area[yFree][x]);
      }
      // Движемся по диагонали влево и вверх
      if ((yFree >= 0) && (xFree >= 0)) {
        areaMove.push(this.area[yFree][xFree]);
      }
      // Движемся по диагонали в право и вверх
      xFree = x + i;
      if ((xFree < boardSize) && (yFree >= 0)) {
        areaMove.push(this.area[yFree][xFree]);
      }
    }
    return areaMove;
  }

  getAreaAttack(currentPosition, distance) {
    const areaAttack = [];
    // Определяем пространство по вертикали
    for (let i = currentPosition.position - this.gamePlay.boardSize * distance;
      i <= currentPosition.position + this.gamePlay.boardSize * distance;
      i += this.gamePlay.boardSize
    ) {
      // Определяем пространство по горизонтали
      if ((i >= 0) && (i < this.gamePlay.boardSize ** 2)) {
        for (let j = i - distance; j <= i + distance; j += 1) {
          if (
            // Ограничиваем слева
            (j >= i - (i % this.gamePlay.boardSize))
            // Ограничиваем справа
            && (j < i + (this.gamePlay.boardSize - (i % this.gamePlay.boardSize)))
          ) {
            areaAttack.push(j);
          }
        }
      }
    }
    // Удаляем клетку героя из списка возможных ходов
    areaAttack.splice(areaAttack.indexOf(currentPosition.position), 1);
    return areaAttack;
  }

  moveDefending(defending, attacker, enemies) {
    const movements = this.getAreaMove(defending, defending.character.distance)
      .filter((item) => this.positionsToDraw.findIndex((hero) => hero.position === item) === -1);
    const coordinates = (hero) => ({
      x: hero.position % this.gamePlay.boardSize,
      y: Math.floor(hero.position / this.gamePlay.boardSize),
    });
    const coordinatesHeroes = {
      defending: coordinates(defending),
      attacker: coordinates(attacker),
    };

    const probablePlaces = () => {
      // Вариант 1: движемся влево
      if (coordinatesHeroes.attacker.x <= coordinatesHeroes.defending.x) {
        // Вариант 1.1: движемся влево и вверх
        if (coordinatesHeroes.attacker.y <= coordinatesHeroes.defending.y) {
          return movements.filter(
            // Ограничиваем слева
            (item) => ((item % this.gamePlay.boardSize) >= coordinatesHeroes.attacker.x)
              // Ограничиваем справа
              && ((item % this.gamePlay.boardSize) <= coordinatesHeroes.defending.x)
              // Ограничиваем снизу
              && (Math.floor(item / this.gamePlay.boardSize) <= coordinatesHeroes.defending.y)
              // Ограничиваем сверху
              && (Math.floor(item / this.gamePlay.boardSize) >= coordinatesHeroes.attacker.y),
          );
        }
        //  Вариант 1.2: движемся влево и вниз
        return movements.filter(
          // Ограничиваем слева
          (item) => ((item % this.gamePlay.boardSize) >= coordinatesHeroes.attacker.x)
            // Ограничиваем справа
            && ((item % this.gamePlay.boardSize) <= coordinatesHeroes.defending.x)
            // Ограничиваем сверху
            && (Math.floor(item / this.gamePlay.boardSize) > coordinatesHeroes.defending.y)
            // Ограничиваем снизу
            && (Math.floor(item / this.gamePlay.boardSize) <= coordinatesHeroes.attacker.y),
        );
      }
      //  Вариант 2: движемся вправо
      // Вариант 2.1: движемся вправо и вверх
      if (coordinatesHeroes.attacker.y <= coordinatesHeroes.defending.y) {
        return movements.filter(
          // Ограничиваем справа
          (item) => ((item % this.gamePlay.boardSize) <= coordinatesHeroes.attacker.x)
            // Ограничиваем слева
            && ((item % this.gamePlay.boardSize) > coordinatesHeroes.defending.x)
            // Ограничиваем снизу
            && (Math.floor(item / this.gamePlay.boardSize) <= coordinatesHeroes.defending.y)
            // Ограничиваем сверху
            && (Math.floor(item / this.gamePlay.boardSize) >= coordinatesHeroes.attacker.y),
        );
      }
      //  Вариант 2.2: движемся вправо и вниз
      return movements.filter(
        // Ограничиваем справа
        (item) => ((item % this.gamePlay.boardSize) <= coordinatesHeroes.attacker.x)
          // Ограничиваем слева
          && ((item % this.gamePlay.boardSize) > coordinatesHeroes.defending.x)
          // Ограничиваем сверху
          && (Math.floor(item / this.gamePlay.boardSize) > coordinatesHeroes.defending.y)
          // Ограничиваем снизу
          && (Math.floor(item / this.gamePlay.boardSize) <= coordinatesHeroes.attacker.y),
      );
    };

    const probables = probablePlaces();
    if (!probables.length) {
      if (!movements.length) {
        const otherEnemies = [...enemies];
        otherEnemies.splice(enemies.indexOf(defending), 1);
        defending = otherEnemies[Math.floor(Math.random() * otherEnemies.length)];
      }
      const randomMovements = this.getAreaMove(defending, defending.character.distance)
        .filter((item) => this.positionsToDraw.findIndex((hero) => hero.position === item) === -1);
      return randomMovements[Math.floor(Math.random() * randomMovements.length)];
    }
    return probables[Math.floor(Math.random() * probablePlaces.length)];
  }

  moveEnemyAttack() {
    this.gamePlay.deselectAll();
    const enemies = this.positionsToDraw.filter((hero) => hero.side === this.sides.enemy.name);
    // Атаковать будет самый сильный персонаж
    const enemyAttacker = enemies
      .find((item) => item.character.attack === Math.max.apply(null, enemies
        .map((hero) => hero.character.attack)));

    return new Promise((resolve, reject) => {
      const damageToAttacker = Math.round(
        Math.max(enemyAttacker.character.attack - this.selected.character.defence,
          enemyAttacker.character.attack * 0.1),
      );
      // Если цель в пределах атаки - к бою!
      if (
        this.getAreaAttack(enemyAttacker, enemyAttacker.character.distanceAttack)
          .find((item) => item === this.selected.position)
      ) {
        this.selected.character.health -= damageToAttacker;
        resolve(damageToAttacker);
        //  Иначе - движемся к нему
      } else {
        reject({ enemyAttacker, enemies });
      }
    });
  }

  onCellClick(index) {
    // TODO: react to click
    function actionAfterAttack() {
      if (this.selected <= 0 || this.selected.character.health <= 0) {
        this.positionsToDraw.splice(this.positionsToDraw.indexOf(this.selected), 1);
      }
      this.gamePlay.redrawPositions(this.positionsToDraw);
      this.selected = null;
      // Проигрыш
      if (!this.positionsToDraw.find((item) => item.side === this.sides.player.name)) {
        GamePlay.showMessage('Игра окончена!');
        this.clear();
        this.score = 0;
        this.gamePlay.drawUi(this.theme);
      }
    }

    // Выделен ли кто-то
    const currentPosition = this.positionsToDraw.find((item) => item.position === index);
    if (this.selected === null) {
      // Не выделен
      if (!currentPosition) {
        //  Не делаем ничего!
      } else if (['bowman', 'swordsman', 'magician'].includes(currentPosition.character.type)) {
        this.selected = currentPosition;
        this.gamePlay.selectCell(index);
      } else {
        GamePlay.showError('Это персонаж противника!');
      }
    } else if (this.currentStatus === this.statuses.freespace) {
      // Чтобы двигать
      [this.selected.position, index].forEach((cell) => this.gamePlay.deselectCell(cell));
      this.selected.position = index;
      this.gamePlay.redrawPositions(this.positionsToDraw);
      this.moveEnemyAttack()
        .then(
          (damageToAttacker) => this.gamePlay.showDamage(this.selected.position, damageToAttacker),
          (reject) => {
            reject.enemyAttacker.position = this.moveDefending(reject.enemyAttacker,
              this.selected, reject.enemies);
          },
        )
        .then(actionAfterAttack.bind(this));
      // Щёлкнули по союзнику
    } else if ((this.currentStatus === this.statuses.allied)
      && (this.selected !== currentPosition)) {
      this.gamePlay.deselectCell(this.selected.position);
      this.selected = currentPosition;
      this.gamePlay.selectCell(index);
      // Щёлкнули по врагу
    } else if (this.currentStatus === this.statuses.enemy) {
      const opponent = this.positionsToDraw.find((hero) => hero.position === index);
      const damageToOpponent = Math.ceil(
        Math.max(this.selected.character.attack - opponent.character.defence,
          this.selected.character.attack * 0.1),
      );
      opponent.character.health -= damageToOpponent;
      // Если убили - удаляем с поля
      if (opponent.character.health <= 0) {
        this.positionsToDraw.splice(this.positionsToDraw.indexOf(opponent), 1);
        this.gamePlay.redrawPositions(this.positionsToDraw);
        this.gamePlay.deselectAll();
        // Убил противника: либо победа, либо он отвечает
        if (!this.positionsToDraw.find((item) => item.side === this.sides.enemy.name)) {
          this.selected = null;
          this.score = this.positionsToDraw
            .reduce((accumulator, hero) => accumulator + hero.character.health, this.score);
          if (this.level === 4) {
            GamePlay.showMessage(`Победа! Ваш счет равен ${this.score}.`);
            this.clear();
            this.gamePlay.drawUi(this.theme);
          } else {
            GamePlay.showMessage(`Победа! Переход на уровень ${this.level + 1}! Ваш счет равен ${this.score}.`);
            this.newGame(this.levelUp(), this.theme);
          }
        } else {
          this.moveEnemyAttack()
            .then(
              (damageToAttacker) => this.gamePlay
                .showDamage(this.selected.position, damageToAttacker),
              (reject) => {
                reject.enemyAttacker.position = this.moveDefending(reject.enemyAttacker,
                  this.selected, reject.enemies);
              },
            )
            .then(actionAfterAttack.bind(this));
        }
      } else {
        this.gamePlay.showDamage(index, damageToOpponent)
          .then(() => this.gamePlay.redrawPositions(this.positionsToDraw))
          // Ответ компьютера
          .then(() => this.moveEnemyAttack())
          .then(
            (damageToAttacker) => this.gamePlay
              .showDamage(this.selected.position, damageToAttacker),
            (reject) => {
              reject.enemyAttacker.position = this.moveDefending(reject.enemyAttacker,
                this.selected, reject.enemies);
            },
          )
          .then(actionAfterAttack.bind(this));
      }
      //  В ином случае - ошибка
    } else {
      GamePlay.showError('Это действие запрещено!');
      this.gamePlay.deselectCell(this.selected.position);
      this.selected = null;
    }
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    this.positionsToDraw.forEach((item) => {
      if (item.position === index) {
        this.gamePlay.showCellTooltip(tooltip(item.character), index);
      }
    });

    // Если кто-то выделен
    if (this.selected) {
      const actions = {
        distance: this.selected.character.distance,
        distanceAttack: this.selected.character.distanceAttack,
      };
      this.movements = this.getAreaMove(this.selected, actions.distance)
        // Оставляем только клетки, не занятые героями
        .filter((item) => this.positionsToDraw.findIndex((hero) => hero.position === item) === -1);
      this.attacks = this.getAreaAttack(this.selected, actions.distanceAttack)
        // Оставляем только клетки, не занятые героями
        .filter((item) => this.positionsToDraw.findIndex((hero) => (hero.position === item)
          && (hero.side === this.sides.player.name)) === -1);
      // Клетка доступна для хода
      if (this.movements.includes(index)) {
        this.gamePlay.selectCell(index, 'green');
        this.gamePlay.setCursor(cursors.pointer);
        this.currentStatus = this.statuses.freespace;
        //  Клетка доступна для атаки
      } else if (this.attacks.includes(index)
        && this.positionsToDraw
          .filter((item) => item.side === this.sides.enemy.name)
          .find((item) => item.position === index)) {
        this.gamePlay.selectCell(index, 'red');
        this.gamePlay.setCursor(cursors.crosshair);
        this.currentStatus = this.statuses.enemy;
        //  Клетка занята союзником
      } else if (this.positionsToDraw
        .filter((item) => item.side === this.sides.player.name)
        .find((item) => (item.position === index) && (item.position !== this.selected.position))) {
        this.gamePlay.setCursor(cursors.pointer);
        this.currentStatus = this.statuses.allied;
        //  Иная ситуация
      } else {
        this.gamePlay.setCursor(cursors.notallowed);
        this.currentStatus = this.statuses.notallowed;
      }
      //  Если никто не выделен
    } else if (this.positionsToDraw.filter((hero) => hero.side === this.sides.player.name)
      .find((item) => item.position === index)) {
      // Союзникам - pointer
      this.gamePlay.setCursor(cursors.pointer);
    } else {
      // Иначе - auto
      this.gamePlay.setCursor(cursors.auto);
    }
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
    this.gamePlay.hideCellTooltip(index);
    if (index !== this.selected || index !== this.selected.position) {
      this.gamePlay.deselectCell(index);
    }
  }
}
