/**
 * 模块说明：认证控制器：处理登录、当前用户信息查询、管理员初始化等 HTTP 请求。
 */
import { asyncHandler } from '../../utils/async-handler.js';
import { ensureAdminSeedUser, getProfile, login } from './auth.service.js';
import { httpError } from '../../utils/http-error.js';

export const postLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    throw httpError(400, 'username 和 password 必填');
  }

  const result = await login({ username, password });
  res.json(result);
});

export const getMe = asyncHandler(async (req, res) => {
  res.json(await getProfile(req.user?.sub));
});

export const postSeedAdmin = asyncHandler(async (req, res) => {
  const result = await ensureAdminSeedUser();
  res.json({
    message: result.created ? '管理员账号已创建' : '管理员账号已存在',
    username: result.username
  });
});
