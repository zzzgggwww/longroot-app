/**
 * 模块说明：总路由模块：统一注册健康检查、认证、项目、行情、用户等 API 路由。
 */
import { Router } from 'express';
import { getHealth } from '../modules/health/health.controller.js';
import { getMe, postLogin, postSeedAdmin } from '../modules/auth/auth.controller.js';
import { postSyncAll, postSyncProject } from '../modules/market/market.controller.js';
import { getProject, getProjectIndicators, getProjectSignals, getProjects, postProject, putProject, removeProject } from '../modules/projects/project.controller.js';
import { getUsers, postUser, putUser, putUserPassword } from '../modules/users/user.controller.js';
import { adminRequired, authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/health', getHealth);
router.post('/auth/seed-admin', postSeedAdmin);
router.post('/auth/login', postLogin);
router.get('/auth/me', authRequired, getMe);

router.use('/projects', authRequired);
router.get('/projects', getProjects);
router.get('/projects/:id', getProject);
router.get('/projects/:id/signals', getProjectSignals);
router.get('/projects/:id/indicators', getProjectIndicators);
router.post('/projects', postProject);
router.put('/projects/:id', putProject);
router.delete('/projects/:id', removeProject);

router.post('/market/sync', authRequired, postSyncAll);
router.post('/market/sync/:id', authRequired, postSyncProject);

router.get('/users', authRequired, adminRequired, getUsers);
router.post('/users', authRequired, adminRequired, postUser);
router.put('/users/:id', authRequired, adminRequired, putUser);
router.put('/users/:id/password', authRequired, adminRequired, putUserPassword);

export default router;
