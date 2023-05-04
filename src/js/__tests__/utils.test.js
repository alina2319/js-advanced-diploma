import { calcTileType, calcHealthLevel, tooltip } from '../utils';

test('calcTileType: top-left', () => {
  const expected = 'top-left';
  const received = calcTileType(0, 8);
  expect(received).toBe(expected);
});

test('calcTileType: top', () => {
  const expected = 'top';
  const received = calcTileType(5, 8);
  expect(received).toBe(expected);
});

test('calcTileType: top-right', () => {
  const expected = 'top-right';
  const received = calcTileType(7, 8);
  expect(received).toBe(expected);
});

test('calcTileType: right', () => {
  const expected = 'right';
  const received = calcTileType(23, 8);
  expect(received).toBe(expected);
});

test('calcTileType: bottom-right', () => {
  const expected = 'bottom-right';
  const received = calcTileType(63, 8);
  expect(received).toBe(expected);
});

test('calcTileType: bottom', () => {
  const expected = 'bottom';
  const received = calcTileType(60, 8);
  expect(received).toBe(expected);
});

test('calcTileType: bottom-left', () => {
  const expected = 'bottom-left';
  const received = calcTileType(56, 8);
  expect(received).toBe(expected);
});

test('calcTileType: left', () => {
  const expected = 'left';
  const received = calcTileType(16, 8);
  expect(received).toBe(expected);
});

test('calcTileType: center', () => {
  const expected = 'center';
  const received = calcTileType(18, 8);
  expect(received).toBe(expected);
});

test('calcHealthLevel: critical', () => {
  const expected = 'critical';
  const received = calcHealthLevel(10);
  expect(received).toBe(expected);
});

test('calcHealthLevel: normal', () => {
  const expected = 'normal';
  const received = calcHealthLevel(40);
  expect(received).toBe(expected);
});

test('calcHealthLevel: high', () => {
  const expected = 'high';
  const received = calcHealthLevel(90);
  expect(received).toBe(expected);
});

test('Должна создать всплывающую подсказку', () => {
  const character = {
    level: 1,
    attack: 25,
    defence: 25,
    health: 50,
    type: 'bowman',
    distance: 2,
    distanceAttack: 2,
  };
  const received = tooltip(character);
  const expected = '🎖1 ⚔25 🛡25 ❤50';
  expect(received).toBe(expected);
});