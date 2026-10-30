import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';
import { SupabaseTokenStorage } from '../supabase-token-storage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const getMock = getItemAsync as jest.MockedFunction<typeof getItemAsync>;
const setMock = setItemAsync as jest.MockedFunction<typeof setItemAsync>;
const deleteMock = deleteItemAsync as jest.MockedFunction<typeof deleteItemAsync>;

describe('supabase token storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores tokens under the app namespace', async () => {
    getMock.mockResolvedValue('token');
    const storage = new SupabaseTokenStorage();

    expect(await storage.getItem('session')).toBe('token');
    expect(getMock).toHaveBeenCalledWith('swapstack.supabase.session');

    await storage.setItem('session', 'next-token');
    expect(setMock).toHaveBeenCalledWith('swapstack.supabase.session', 'next-token');

    await storage.removeItem('session');
    expect(deleteMock).toHaveBeenCalledWith('swapstack.supabase.session');
  });
});
