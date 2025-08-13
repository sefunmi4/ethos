import { requestHelp, removeHelpRequest } from './post';
import { axiosWithAuth } from '../utils/authUtils';

jest.mock('../utils/authUtils', () => ({
  axiosWithAuth: { post: jest.fn(), delete: jest.fn() },
}));

describe('requestHelp legacy fallbacks', () => {
  beforeEach(() => {
    (axiosWithAuth.post as unknown as jest.Mock).mockReset();
    (axiosWithAuth.delete as unknown as jest.Mock).mockReset();
  });

  it('falls back to legacy tasks endpoint when post routes are missing', async () => {
    const mockPost = axiosWithAuth.post as unknown as jest.Mock;
    mockPost
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } })
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } })
      .mockResolvedValueOnce({ data: { request: { id: 'r1' }, subRequests: [] } });

    const res = await requestHelp('p1', 'task');
    expect(res.request.id).toBe('r1');
    const payload = { subtype: 'task' };
    expect(mockPost).toHaveBeenNthCalledWith(1, '/posts/p1/request-help', payload);
    expect(mockPost).toHaveBeenNthCalledWith(2, '/posts/tasks/p1/request-help', payload);
    expect(mockPost).toHaveBeenNthCalledWith(3, '/tasks/p1/request-help', payload);
  });

  it('falls back to legacy tasks delete route', async () => {
    const mockDelete = axiosWithAuth.delete as unknown as jest.Mock;
    mockDelete
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } })
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } })
      .mockResolvedValueOnce({ data: { success: true } });

    const res = await removeHelpRequest('p1', 'task');
    expect(res.success).toBe(true);
    expect(mockDelete).toHaveBeenNthCalledWith(1, '/posts/p1/request-help');
    expect(mockDelete).toHaveBeenNthCalledWith(2, '/posts/tasks/p1/request-help');
    expect(mockDelete).toHaveBeenNthCalledWith(3, '/tasks/p1/request-help');
  });
});
