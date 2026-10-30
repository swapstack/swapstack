import { getItem, removeItem, setItem, storage } from '../storage';

describe('storage helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['false', false],
    ['0', 0],
    ['""', ''],
    ['null', null],
  ] as const)('returns stored falsy value %s', (serialized, expected) => {
    jest.spyOn(storage, 'getString').mockReturnValue(serialized);
    expect(getItem<typeof expected>('key')).toBe(expected);
  });

  it('returns null for missing and malformed values', () => {
    jest.spyOn(storage, 'getString').mockReturnValue(undefined);
    expect(getItem('missing')).toBeNull();

    jest.spyOn(storage, 'getString').mockReturnValue('{invalid');
    expect(getItem('malformed')).toBeNull();
  });

  it('serializes and removes values synchronously', () => {
    const set = jest.spyOn(storage, 'set');
    const remove = jest.spyOn(storage, 'remove');

    setItem('enabled', false);
    expect(set).toHaveBeenCalledWith('enabled', 'false');

    removeItem('enabled');
    expect(remove).toHaveBeenCalledWith('enabled');
  });
});
