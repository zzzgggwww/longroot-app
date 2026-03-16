import { Router } from 'express';
import { getHealth } from '../modules/health/health.controller.js';
import { postLogin, postSeedAdmin } from '../modules/auth/auth.controller.js';
import { getProject, getProjectIndicators, getProjectSignals, getProjects, postProject, putProject, removeProject } from '../modules/projects/project.controller.js';
import { postSyncAll, postSyncProject } from '../modules/market/market.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/health', getHealth);
router.post('/auth/seed-admin', postSeedAdmin);
router.post('/auth/login', postLogin);

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

export default router;
