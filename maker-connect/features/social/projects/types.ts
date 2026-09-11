export type FeedCategory = '3D_Printing' | 'Robotics' | 'IoT' | 'Woodworking';

export type FeedSort = 'newest' | 'oldest' | 'top';

export type ProjectVisibility = 'public' | 'private_owner' | 'private_team';

export type ProjectItem = {
  id: number;
  title: string;
  description: string | null;
  tags: ('Printing3D' | 'Robotics' | 'IoT' | 'Woodworking')[];
  visibility: ProjectVisibility;
  teamId: number | null;
  votes: number;
  fileCount: number;
  creatorId: number;
  creatorName: string | null;
  parentId: number | null;
  coverImageUrl: string | null;
  printerBrand: string | null;
  printerModel: string | null;
  printerMaterial: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectsFeedResponse = {
  data: ProjectItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    tag: string | null;
    q: string | null;
    sort: FeedSort;
  };
};

export type VoteProjectResponse = {
  data: {
    projectId: number;
    votes: number;
    alreadyVoted: boolean;
  };
};

export type ShareProjectResponse = {
  data: {
    projectId: number;
    shares: number;
    alreadyShared: boolean;
  };
};
