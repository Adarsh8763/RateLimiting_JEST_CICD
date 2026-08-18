import {sum} from '../utils.js';

describe('sum function', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
  it('adds -1 + -1 to equal -2', () => {
    expect(sum(-1, -1)).toBe(-2);
  });
});