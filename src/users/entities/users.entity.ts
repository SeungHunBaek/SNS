import {
  Column,
  Entity,
  JoinTable,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RolsEnum } from '../const/rols.enum';
import { PostsModel } from 'src/posts/entities/posts.entity';

@Entity()
export class UsersModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 20,
    unique: true,
  })
  nickname: string;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  password: string;

  @Column({
    enum: Object.values(RolsEnum),
    default: RolsEnum.USER,
  })
  role: RolsEnum;

  @OneToMany(() => PostsModel, (post) => post.author)
  posts: PostsModel[];
}
