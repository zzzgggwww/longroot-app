/**
 * 模块说明：项目控制器：处理项目列表、详情、信号、指标和 CRUD 接口。
 */
import { asyncHandler } from '../../utils/async-handler.js';
import { createProject, deleteProject, getProjectById, listProjectIndicators, listProjectSignals, listProjects, updateProject } from './project.service.js';

export const getProjects = asyncHandler(async (req, res) => {
  res.json(await listProjects());
});

export const getProject = asyncHandler(async (req, res) => {
  res.json(await getProjectById(Number(req.params.id)));
});

export const postProject = asyncHandler(async (req, res) => {
  res.status(201).json(await createProject(req.body || {}));
});

export const getProjectSignals = asyncHandler(async (req, res) => {
  res.json(await listProjectSignals(Number(req.params.id), Number(req.query.limit || 20)));
});

export const getProjectIndicators = asyncHandler(async (req, res) => {
  res.json(await listProjectIndicators(Number(req.params.id), Number(req.query.limit || 20)));
});

export const putProject = asyncHandler(async (req, res) => {
  res.json(await updateProject(Number(req.params.id), req.body || {}));
});

export const removeProject = asyncHandler(async (req, res) => {
  res.json(await deleteProject(Number(req.params.id)));
});
