import { expect, test } from 'vitest';
import { registerService } from '@streamyx/core';
import crunchyroll from '../crunchyroll';

test('register service', () => {
  // @ts-ignore
  const service = registerService(crunchyroll);
  expect(service).toBeDefined();
  expect(service).toHaveProperty('name', 'crunchyroll');
  expect(service).toHaveProperty('api');
  expect(service).toHaveProperty('fetchContentMetadata');
});

test('sign in', async () => {
  const username = '';
  const password = '';
  if (!username || !password) return; // Skip test if credentials are not provided
  // @ts-ignore
  const service = registerService(crunchyroll);
  const api = service.api!;
  await api.auth.signIn(username, password);
  console.log(service.core.store.state);
  expect(service.core.store.state.accessToken).toBeDefined();
  await api.auth.signOut();
});
