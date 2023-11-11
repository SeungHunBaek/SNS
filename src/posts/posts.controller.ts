import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Delete,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { NotFoundError } from 'rxjs';

interface PostModel {
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

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  getPosts(): PostModel[] {
    return posts;
  }

  @Get(':id')
  getPost(@Param('id') id: string): PostModel {
    const post: PostModel = posts.find((post) => post.id === +id);
    if (!post) throw new NotFoundException();

    return post;
  }

  @Post()
  postPosts(
    @Body('author') author: string,
    @Body('title') title: string,
    @Body('content') content: string,
  ): PostModel {
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

  @Put(':id')
  putPost(
    @Param('id') id: string,
    @Body('author') author?: string,
    @Body('title') title?: string,
    @Body('content') content?: string,
  ): PostModel {
    const post = posts.find((post) => post.id === +id);
    if (!post) throw new NotFoundException();

    if (author) post.author = author;
    if (title) post.title = title;
    if (content) post.content = content;

    posts = posts.map((prevPost) => (prevPost.id === +id ? post : prevPost));

    return post;
  }

  @Delete(':id')
  deletePost(@Param('id') id: string): PostModel[] {
    const post: PostModel = posts.find((post) => post.id === +id);
    if (!post) throw new NotFoundException();

    posts = posts.filter((_post) => _post.id !== +id);
    return posts;
  }
}
