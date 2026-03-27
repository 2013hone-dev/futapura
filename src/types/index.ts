export type UserWithCounts = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  createdAt: Date;
  _count: { followedBy: number; following: number; posts: number };
};

export type PostWithDetails = {
  id: string;
  content: string;
  imageUrl: string | null;
  visibility: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  circle: { id: string; name: string } | null;
  comments: CommentWithAuthor[];
  reactions: ReactionWithStamp[];
  _count: { comments: number; reactions: number };
};

export type CommentWithAuthor = {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

export type ReactionWithStamp = {
  id: string;
  type: string;
  userId: string;
  stamp: { id: string; name: string; emoji: string | null } | null;
};

export type CircleWithDetails = {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isPrivate: boolean;
  createdAt: Date;
  owner: { id: string; username: string; displayName: string; avatarUrl: string | null };
  _count: { members: number; posts: number };
};
