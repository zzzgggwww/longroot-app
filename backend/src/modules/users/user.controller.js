/**
 * 模块说明：用户控制器：处理用户列表、创建、角色状态更新、密码修改接口。
 */
import { asyncHandler } from '../../utils/async-handler.js';
import { createUser, listUsers, updateUser, updateUserPassword } from './user.service.js';

export const getUsers = asyncHandler(async (req, res) => {
  res.json(await listUsers());
});

export const postUser = asyncHandler(async (req, res) => {
  res.status(201).json(await createUser(req.body || {}));
});

export const putUser = asyncHandler(async (req, res) => {
  res.json(await updateUser(Number(req.params.id), req.body || {}, req.user || {}));
});

export const putUserPassword = asyncHandler(async (req, res) => {
  res.json(await updateUserPassword(Number(req.params.id), req.body || {}, req.user || {}));
});
