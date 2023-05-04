import Character from '../Character';
import Bowman from '../Characters/Bowman';

test('Должна выбросить исключение при создании объекта класса Character', () => {
  const received = () => new Character();
  expect(received).toThrow('Данный класс нельзя использовать для создания персонажа');
});

test('Должна создавать потомков Персонажа', () => {
  const received = new Bowman(1);
  const expected = {
    level: 1,
    attack: 25,
    defence: 25,
    health: 50,
    type: 'bowman',
    distance: 2,
    distanceAttack: 2,
  };
  expect(received).toEqual(expected);
});