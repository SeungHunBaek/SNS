import { Injectable, NotFoundException } from '@nestjs/common';

export interface PostModel {
  id: number;
  author: string;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
}

let posts: PostModel[] = [
  {
    id: 1,
    author: 'newJeans',
    title: '민지',
    content: '노래하는 민자',
    likeCount: 2313,
    commentCount: 132,
  },
  {
    id: 2,
    author: 'random',
    title: '민',
    content: '노래하는 민자',
    likeCount: 23,
    commentCount: 1,
  },
  {
    id: 3,
    author: 'nens',
    title: '지',
    content: '노래하는 민자',
    likeCount: 1,
    commentCount: 0,
  },
];

@Injectable()
export class PostsService {
  getAllPosts() {
    return posts;
  }

  getPostById(id: number) {
    const post: PostModel = posts.find((post) => post.id === +id);
    if (!post) throw new NotFoundException();

    return post;
  }

  createPost(author: string, title: string, content: string) {
    const post: PostModel = {
      id: posts[posts.length - 1].id + 1,
      author,
      title,
      content,
      likeCount: 0,
      commentCount: 0,
    };

    posts = [...posts, post];

    return post;
  }

  updatePost(postId: number, author: string, title: string, content: string) {
    const post = posts.find((post) => post.id === +postId);
    if (!post) throw new NotFoundException();

    if (author) post.author = author;
    if (title) post.title = title;
    if (content) post.content = content;

    posts = posts.map((prevPost) => (prevPost.id === postId ? post : prevPost));

    return post;
  }

  deletePost(postId: number) {
    const post: PostModel = posts.find((post) => post.id === postId);
    if (!post) throw new NotFoundException();

    posts = posts.filter((_post) => _post.id !== postId);
    return posts;
  }
}
