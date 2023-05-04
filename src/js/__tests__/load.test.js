import GameStateService from '../GameStateService';

jest.mock('../GameStateService');

beforeEach(() => {
  jest.resetAllMocks();
});

test('Должна загрузить сохраненную игру', () => {
  const state = {
    level: 1,
    positions: [],
    theme: 'prairie',
    score: 0,
  };
  const stateService = new GameStateService();
  stateService.load.mockReturnValue(state);
  const received = stateService.load();
  expect(received).toEqual(state);
});