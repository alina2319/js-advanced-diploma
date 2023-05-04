import GameStateService from '../GameStateService';

test('Должна выбросить исключение при невозможности загрузить игру', () => {
  const stateService = new GameStateService(null);
  const received = () => stateService.load();
  expect(received).toThrow('Ошибка при загрузке игры');
});