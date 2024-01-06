import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostsModel } from './entities/posts.entity';

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
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
  ) {}

  async getAllPosts() {
    return this.postsRepository.find({
      relations: ['author'],
    });
  }

  async getPostById(id: number) {
    const post = await this.postsRepository.findOne({
      where: {
        id,
      },
      relations: ['author'],
    });

    if (!post) throw new NotFoundException();
    return post;
  }

  async createPost(authorId: number, title: string, content: string) {
    // 1) create -> 저정할 객체를 생성
    // 2) save -> 객체를 저장한다 (create 메서드에서 생성한 객체로)
    const post = this.postsRepository.create({
      author: {
        id: authorId,
      },
      title,
      content,
      likeCount: 0,
      commentCount: 0,
    });

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async updatePost(postId: number, title: string, content: string) {
    const post = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
    });

    if (!post) throw new NotFoundException();
    if (title) post.title = title;
    if (content) post.content = content;

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async deletePost(postId: number) {
    const post = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
    });
    if (!post) throw new NotFoundException();

    await this.postsRepository.delete(post);

    return postId;
  }
}
