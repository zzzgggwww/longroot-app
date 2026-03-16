import { asyncHandler } from '../../utils/async-handler.js';
import { createProject, deleteProject, getProjectById, listProjects, updateProject } from './project.service.js';

export const getProjects = asyncHandler(async (req, res) => {
  res.json(await listProjects());
});

export const getProject = asyncHandler(async (req, res) => {
  res.json(await getProjectById(Number(req.params.id)));
});

export const postProject = asyncHandler(async (req, res) => {
  res.status(201).json(await createProject(req.body || {}));
});

export const putProject = asyncHandler(async (req, res) => {
  res.json(await updateProject(Number(req.params.id), req.body || {}));
});

export const removeProject = asyncHandler(async (req, res) => {
  res.json(await deleteProject(Number(req.params.id)));
});
