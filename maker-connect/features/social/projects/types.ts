export type FeedCategory = '3D_Printing' | 'Robotics' | 'IoT' | 'Woodworking';

export type FeedSort = 'newest' | 'oldest' | 'top';

export type ProjectItem = {
  id: number;
  title: string;
  description: string | null;
  category: 'Printing3D' | 'Robotics' | 'IoT' | 'Woodworking';
  votes: number;
  creatorId: number;
  creatorName: string | null;
  parentId: number | null;
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
    category: string | null;
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
