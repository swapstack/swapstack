import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';
import { SecureSessionStorage } from '../secure-session-storage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const getMock = getItemAsync as jest.MockedFunction<typeof getItemAsync>;
const setMock = setItemAsync as jest.MockedFunction<typeof setItemAsync>;
const deleteMock = deleteItemAsync as jest.MockedFunction<typeof deleteItemAsync>;
const session = {
  token: 'token',
  user: { id: 'user', email: 'user@example.com' },
};

describe('secure session storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no session is stored', async () => {
    getMock.mockResolvedValue(null);
    expect(await new SecureSessionStorage().getSession()).toBeNull();
  });

  it('serializes, reads, and clears sessions', async () => {
    getMock.mockResolvedValue(JSON.stringify(session));
    const storage = new SecureSessionStorage();

    await storage.saveSession(session);
    expect(setMock).toHaveBeenCalledWith('swapstack.auth.session', JSON.stringify(session));
    expect(await storage.getSession()).toEqual(session);

    await storage.clearSession();
    expect(deleteMock).toHaveBeenCalledWith('swapstack.auth.session');
  });

  it('clears corrupt stored data', async () => {
    getMock.mockResolvedValue('{invalid');
    expect(await new SecureSessionStorage().getSession()).toBeNull();
    expect(deleteMock).toHaveBeenCalledWith('swapstack.auth.session');
  });
});
