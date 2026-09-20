import { describe, expect, it } from 'vitest';
import { User } from '../models/user.model';

describe('user role hydration', () => {
  it('preserves assigned roles from API user data', () => {
    const user = new User({
      id: 'u-1',
      roles: [
        { key: 'admin', type: { code: 'admin', name: 'Admin' } },
        { key: 'manager', type: { code: 'manager', name: 'Manager' } }
      ]
    });

    expect(user.roles).toHaveLength(2);
    expect(user.role).toEqual(expect.objectContaining({ key: 'admin' }));
  });
});
