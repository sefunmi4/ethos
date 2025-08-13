import { requestHelp, removeHelpRequest } from './post';
import { axiosWithAuth } from '../utils/authUtils';

jest.mock('../utils/authUtils', () => ({
  axiosWithAuth: { post: jest.fn(), delete: jest.fn() },
}));

describe('requestHelp API', () => {
  beforeEach(() => {
    (axiosWithAuth.post as unknown as jest.Mock).mockReset();
    (axiosWithAuth.delete as unknown as jest.Mock).mockReset();
  });

  it('calls the posts request-help route with subtype', async () => {
    const mockPost = axiosWithAuth.post as unknown as jest.Mock;
    mockPost.mockResolvedValueOnce({ data: { request: { id: 'r1' }, subRequests: [] } });

    const res = await requestHelp('p1', 'task');
    expect(res.request.id).toBe('r1');
    expect(mockPost).toHaveBeenCalledWith('/posts/p1/request-help', { subtype: 'task' });
  });

  it('calls posts route when removing help request', async () => {
    const mockDelete = axiosWithAuth.delete as unknown as jest.Mock;
    mockDelete.mockResolvedValueOnce({ data: { success: true } });

    const res = await removeHelpRequest('p1');
    expect(res.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith('/posts/p1/request-help');
  });
});
