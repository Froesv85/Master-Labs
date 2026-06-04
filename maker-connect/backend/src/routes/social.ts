import { Router } from 'express';

import { communitiesRouter } from './communities';
import { postsRouter } from './posts';
import { projectsRouter } from './projects';
import { robotsRouter } from './robots';
import { teamsRouter } from './teams';
import { usersRouter } from './users';

export const socialRouter = Router();

// Social domain namespace to keep API contracts grouped and versionable.
socialRouter.use('/users', usersRouter);
socialRouter.use('/posts', postsRouter);
socialRouter.use('/projects', projectsRouter);
socialRouter.use('/robots', robotsRouter);
socialRouter.use('/teams', teamsRouter);
socialRouter.use('/communities', communitiesRouter);
