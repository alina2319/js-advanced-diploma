import GamePlay from "./GamePlay";
import GameState from "./GameState";
import themes from "./themes";
import PositionedCharacter from "./PositionedCharacter";
import Team from "./Team";
import { generateTeam } from "./generators";
import { getInfo, getRightPositions } from "./Function";
import cursors from "./cursors";

let userTeamPositions = [];
let enemyTeamPositions = [];
let currentSelected = 0;

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.userTeam = [];
    this.enemyTeam = [];
    this.level = 1;
    this.index = 0;
    this.move = "user";
    this.selected = false;
    this.activeCharacter = {};
    this.stateService = stateService;
    this.point = 0;
  }

  events() {
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addNewGameListener(this.onNewGame.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGame.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGame.bind(this));
  }

  init() {
    // TODO: add event listeners to gamePlay events
    this.events();
    this.gamePlay.drawUi(themes[this.level]);
    this.userTeam = Team.getStartUserTeam();
    this.level = 1;
    this.enemyTeam = generateTeam(Team.getEnemyTeam(), 1, 2);
    this.addPositionCharacted(this.userTeam, this.enemyTeam);
    this.gamePlay.redrawPositions([
      ...userTeamPositions,
      ...enemyTeamPositions,
    ]);

    // TODO: load saved stated from stateService
  }

  addPositionCharacted(userTeam, enemyTeam) {
    for (let i = 0; i < userTeam.length; i += 1) {
      let userStartPosition = this.randomUserPosition();
      userTeamPositions.push(
        new PositionedCharacter(userTeam[i], userStartPosition)
      );
    }
    for (let i = 0; i < enemyTeam.length; i += 1) {
      let enemyStartPosition = this.randomEnemyPosition();
      enemyTeamPositions.push(
        new PositionedCharacter(enemyTeam[i], enemyStartPosition)
      );
    }
  }

  randomUserPosition() {
    return Math.floor(Math.random() * 8) * 8 + Math.floor(Math.random() * 2);
  }
  randomEnemyPosition() {
    return (
      Math.floor(Math.random() * 8) * 8 + (Math.floor(Math.random() * 2) + 6)
    );
  }

  nextLevel() {
    this.move = "user";
    this.gamePlay.drawUi(themes[this.level]);
    if (this.level === 2) {
      this.userTeam = generateTeam(Team.getUserTeam(), 1, 1);
      this.enemyTeam = generateTeam(
        Team.getEnemyTeam(),
        2,
        this.userTeam.length + userTeamPositions.length
      );
      this.addPositionCharacted(this.userTeam, this.enemyTeam);
    } else if (this.level === 3) {
      this.userTeam = generateTeam(Team.getUserTeam(), 2, 2);
      this.enemyTeam = generateTeam(
        Team.getEnemyTeam(),
        3,
        this.userTeam.length + userTeamPositions.length
      );
      this.addPositionCharacted(this.userTeam, this.enemyTeam);
    } else if (this.level === 4) {
      this.userTeam = generateTeam(Team.getUserTeam(), 3, 2);
      this.enemyTeam = generateTeam(
        Team.getEnemyTeam(),
        4,
        this.userTeam.length + userTeamPositions.length
      );
      this.addPositionCharacted(this.userTeam, this.enemyTeam);
    } else {
      GamePlay.showMessage(
        `Ваш результат ${this.ppoint}. Лучший результат ${this.maxPoint}`
      );
      return;
    }
  }

  async onCellClick(index) {
    // TODO: react to click
    this.index = index;
    if (this.gamePlay.boardEl.style.cursor === "not-allowed") {
      GamePlay.showError("Неверное действие!");
    } else if (
      this.move === "user" &&
      this.getIndex([...userTeamPositions]) !== -1
    ) {
      this.gamePlay.deselectCell(currentSelected);
      this.gamePlay.selectCell(index);
      currentSelected = index;
      this.selected = true;
      this.activeCharacter = [...userTeamPositions].find(
        (item) => item.position === index
      );
      console.log(this.activeCharacter);
    } else if (
      this.selected &&
      this.gamePlay.boardEl.style.cursor === "pointer"
    ) {
      this.activeCharacter.position = index;
      this.gamePlay.deselectCell(index);
      this.gamePlay.deselectCell(currentSelected);
      this.gamePlay.redrawPositions([
        ...userTeamPositions,
        ...enemyTeamPositions,
      ]);
      this.move = "enemy";
      this.selected = false;
      this.enemyMove();
    } else if (
      this.selected &&
      this.gamePlay.boardEl.style.cursor === "crosshair"
    ) {
      const attackedEnemy = [...enemyTeamPositions].find(
        (item) => item.position === index
      );
      this.gamePlay.deselectCell(index);
      this.gamePlay.deselectCell(currentSelected);
      this.gamePlay.setCursor(cursors.auto);
      this.selected = false;
      await this.userAttack(this.activeCharacter.character, attackedEnemy);
      if (enemyTeamPositions.length > 0) {
        this.enemyMove();
      }
    }
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    this.index = index;

    for (const item of [...userTeamPositions, ...enemyTeamPositions]) {
      if (item.position === index) {
        this.gamePlay.showCellTooltip(getInfo(item.character), index);
      }
    }

    if (this.selected) {
      const rightPositions = getRightPositions(
        this.activeCharacter.position,
        this.activeCharacter.character.distance
      );
      const rightAttack = getRightPositions(
        this.activeCharacter.position,
        this.activeCharacter.character.distanceAttack
      );

      if (this.getIndex([...userTeamPositions]) !== -1) {
        this.gamePlay.setCursor(cursors.pointer);
      } else if (
        rightPositions.includes(index) &&
        this.getIndex([...userTeamPositions, ...enemyTeamPositions]) === -1
      ) {
        this.gamePlay.selectCell(index, "green");
        this.gamePlay.setCursor(cursors.pointer);
      } else if (
        rightAttack.includes(index) &&
        this.getIndex([...enemyTeamPositions]) !== -1
      ) {
        this.gamePlay.selectCell(index, "red");
        this.gamePlay.setCursor(cursors.crosshair);
      } else {
        this.gamePlay.setCursor(cursors.notallowed);
      }
    }
  }

  onNewGame() {
    this.userTeam = [];
    this.enemyTeam = [];
    userTeamPositions = [];
    enemyTeamPositions = [];

    this.init();
  }

  onSaveGame() {
    const maxPoint = this.maxPoints();
    const currentGameState = {
      point: this.point,
      maxPoint,
      level: this.level,
      userTeamPositions,
      enemyTeamPositions,
    };
    this.stateService.save(GameState.from(currentGameState));
    GamePlay.showMessage("Game is saved!");
  }

  onLoadGame() {
    try {
      const loadGameState = this.stateService.load();
      if (loadGameState) {
        this.point = loadGameState.point;
        this.level = loadGameState.level;
        userTeamPositions = loadGameState.userTeamPositions;
        enemyTeamPositions = loadGameState.enemyTeamPositions;
        this.gamePlay.drawUi(themes[this.level]);
        this.gamePlay.redrawPositions([
          ...userTeamPositions,
          ...enemyTeamPositions,
        ]);
      }
      GamePlay.showMessage("Game is loaded!");
    } catch (e) {
      GamePlay.showError("Something is wrong! Memory is empty");
      this.onNewGame();
    }
  }

  maxPoints() {
    let maxPoint = 0;
    try {
      const loadGameState = this.stateService.load();
      if (loadGameState) {
        maxPoint = Math.max(loadGameState.maxPoint, this.point);
      }
    } catch (e) {
      maxPoint = this.point;
    }
    return maxPoint;
  }

  enemyMove() {
    if ((this.move = "enemy")) {
      for (let enemyPers of [...enemyTeamPositions]) {
        const rightAttack = getRightPositions(
          enemyPers.position,
          this.activeCharacter.character.distanceAttack
        );
        const target = this.enemyAttack(rightAttack);
        if (target !== null) {
          this.enemyTeamAttack(enemyPers.character, target);
          return;
        }
      }
      const randomIndex = Math.floor(
        Math.random() * [...enemyTeamPositions].length
      );
      const randomEnemy = [...enemyTeamPositions][randomIndex];

      const itemEnemyDistance = randomEnemy.character.distance;
      let tempPRow;
      let tempPCOlumn;
      let stepRow;
      let stepColumn;
      let Steps;
      const itemEnemyRow = this.positionRow(randomEnemy.position);
      const itemEnemyColumn = this.positionColumn(randomEnemy.position);
      let nearUser = {};

      for (const itemUser of [...userTeamPositions]) {
        const itemUserRow = this.positionRow(itemUser.position);
        const itemUserColumn = this.positionColumn(itemUser.position);
        stepRow = itemEnemyRow - itemUserRow;
        stepColumn = itemEnemyColumn - itemUserColumn;
        Steps = Math.abs(stepRow) + Math.abs(stepColumn);

        if (nearUser.steps === undefined || Steps < nearUser.steps) {
          nearUser = {
            steprow: stepRow,
            stepcolumn: stepColumn,
            steps: Steps,
            positionRow: itemUserRow,
            positionColumn: itemUserColumn,
          };
        }
      }
      if (Math.abs(nearUser.steprow) === Math.abs(nearUser.stepcolumn)) {
        if (Math.abs(nearUser.steprow) > itemEnemyDistance) {
          tempPRow =
            itemEnemyRow - itemEnemyDistance * Math.sign(nearUser.steprow);
          tempPCOlumn =
            itemEnemyColumn -
            itemEnemyDistance * Math.sign(nearUser.stepcolumn);

          randomEnemy.position = this.rowColumnToIndex(tempPRow, tempPCOlumn);
        } else {
          tempPRow =
            itemEnemyRow - (nearUser.steprow - 1 * Math.sign(nearUser.steprow));
          tempPCOlumn =
            itemEnemyColumn -
            (nearUser.stepcolumn - 1 * Math.sign(nearUser.steprow));

          randomEnemy.position = this.rowColumnToIndex(tempPRow, tempPCOlumn);
        }
      } else if (nearUser.stepcolumn === 0) {
        if (Math.abs(nearUser.steprow) > itemEnemyDistance) {
          tempPRow =
            itemEnemyRow - itemEnemyDistance * Math.sign(nearUser.steprow);

          randomEnemy.position = this.rowColumnToIndex(
            tempPRow,
            itemEnemyColumn
          );
        } else {
          tempPRow =
            itemEnemyRow - (nearUser.steprow - 1 * Math.sign(nearUser.steprow));

          randomEnemy.position = this.rowColumnToIndex(
            tempPRow,
            itemEnemyColumn
          );
        }
      } else if (nearUser.steprow === 0) {
        if (Math.abs(nearUser.stepcolumn) > itemEnemyDistance) {
          tempPCOlumn =
            itemEnemyColumn -
            itemEnemyDistance * Math.sign(nearUser.stepcolumn);

          randomEnemy.position = this.rowColumnToIndex(
            itemEnemyRow,
            tempPCOlumn
          );
        } else {
          const tempFormul =
            nearUser.stepcolumn - 1 * Math.sign(nearUser.stepcolumn);
          tempPCOlumn = itemEnemyColumn - tempFormul;

          randomEnemy.position = this.rowColumnToIndex(
            itemEnemyRow,
            tempPCOlumn
          );
        }
      } else if (Math.abs(nearUser.steprow) > Math.abs(nearUser.stepcolumn)) {
        if (Math.abs(nearUser.steprow) > itemEnemyDistance) {
          tempPRow =
            itemEnemyRow - itemEnemyDistance * Math.sign(nearUser.steprow);

          randomEnemy.position = this.rowColumnToIndex(
            tempPRow,
            itemEnemyColumn
          );
        } else {
          tempPRow = itemEnemyRow - nearUser.steprow;

          randomEnemy.position = this.rowColumnToIndex(
            tempPRow,
            itemEnemyColumn
          );
        }
      } else if (Math.abs(nearUser.stepcolumn) > itemEnemyDistance) {
        tempPCOlumn =
          itemEnemyColumn - itemEnemyDistance * Math.sign(nearUser.stepcolumn);

        randomEnemy.position = this.rowColumnToIndex(itemEnemyRow, tempPCOlumn);
      } else {
        randomEnemy.position = this.rowColumnToIndex(
          itemEnemyRow,
          itemEnemyColumn
        );
      }

      this.gamePlay.redrawPositions([
        ...userTeamPositions,
        ...enemyTeamPositions,
      ]);
      this.move = "user";
    }
  }

  enemyAttack(rightAttack) {
    for (const item of [...enemyTeamPositions]) {
      if (rightAttack.includes(item.position)) {
        return item;
      }
    }
    return null;
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
    this.gamePlay.hideCellTooltip(index);
    this.gamePlay.deselectCell(index);
    this.gamePlay.setCursor(cursors.auto);
  }

  getIndex(arr) {
    return arr.findIndex((item) => item.position === this.index);
  }

  positionRow(index) {
    return Math.floor(index / this.gamePlay.boardSize);
  }

  positionColumn(index) {
    return index % this.gamePlay.boardSize;
  }

  rowColumnToIndex(row, column) {
    return row * 8 + column;
  }

  async userAttack(attacker, attackedEnemy) {
    const targetEnemy = attackedEnemy.character;
    let damage = Math.max(
      attacker.attack - targetEnemy.defence,
      attacker.attack * 0.1
    );
    damage = Math.floor(damage);

    await this.gamePlay.showDamage(attackedEnemy.position);
    targetEnemy.health -= damage;
    this.move = "enemy";
    if (targetEnemy.health <= 0) {
      enemyTeamPositions = enemyTeamPositions.filter(
        (item) => item.position !== attackedEnemy.position
      );

      if (enemyTeamPositions.length === 0) {
        for (const item of userTeamPositions) {
          this.point += item.character.health;
          item.character.level += 1;
          item.character.attack = Math.floor(
            Math.max(
              item.character.attack,
              item.character.attack * (1.8 - item.character.health / 100)
            )
          );
          item.character.defence = Math.floor(
            Math.max(
              item.character.defence,
              item.character.defence * (1.8 - item.character.health / 100)
            )
          );
          item.character.health =
            item.character.health + 80 < 100 ? item.character.health + 80 : 100;
        }

        this.level += 1;
        this.nextLevel();
      }
    }
    this.gamePlay.redrawPositions([
      ...userTeamPositions,
      ...enemyTeamPositions,
    ]);
  }

  async enemyTeamAttack(attacker, attackedUser) {
    const targetUser = attackedUser.character;
    let damage = Math.max(
      attacker.attack - targetUser.defence,
      attacker.attack * 0.1
    );
    damage = Math.floor(damage);

    await this.gamePlay.showDamage(attackedUser.position);
    targetUser.health -= damage;
    this.move = "user";
    if (targetUser.health <= 0) {
      userTeamPositions = userTeamPositions.filter(
        (item) => item.position !== attackedUser.position
      );
    }

    if (userTeamPositions.length === 0) {
      GamePlay.showMessage("Game Over!!!");
    }
    this.gamePlay.redrawPositions([
      ...userTeamPositions,
      ...enemyTeamPositions,
    ]);
  }
}
