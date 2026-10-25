import { InMemorySessionStorage } from '@/core';
import { getAuthSessionStorage, setAuthSessionStorage } from '../registry';

describe('auth session storage registry', () => {
  it('allows replacing the shared session storage', () => {
    const previous = getAuthSessionStorage();
    const storage = new InMemorySessionStorage();

    setAuthSessionStorage(storage);
    expect(getAuthSessionStorage()).toBe(storage);

    setAuthSessionStorage(previous);
  });
});
