import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersModel } from 'src/users/entities/users.entity';
import { HASH_ROUNDS, JWT_SECRET } from './const/auth.const';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}
  /**
    1) registerWithEmail
      - email, nickname, pwassowrd 입력 받아 생성
      - accessToken, refreshToken 생성
    
    2) loginWithEmail
      - email, pwassowrd 입력 받아 사용자 검증
      - 검증이 완료되면 accessToken, refreshToken 반환
    
    3) loginUser
      - 1), 2)에서 필요한 accessToken과 refreshToken을 반환하는 로직
    
    4) signToken
      - 3)에서 필요한 accessToken과 refreshToken을 sign하는 로직
    
    5) authenticateWithEmailAndPassword
      - 2)에서 로그인을 진행할때 필요한 기본적인 검증 진행
          1. 사용자가 존재하는지 확인 (email)
          2. 비밀번호가 맞는지 확인
          3. 모두 통과되면 찾은 사용자 정보 반환
          3. 2)에서 반환된 데이터를 기반으로 토큰 생성
  */

  /**
   * payload에 들어갈 정보
   *
   * 1) email
   * 2) sub -> id
   * 3) type: 'access' || 'refresh'
   */
  signToken(user: Pick<UsersModel, 'email' | 'id'>, isRefreshToken: boolean) {
    const payload = {
      email: user.email,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payload, {
      secret: JWT_SECRET,
      // seconds
      expiresIn: isRefreshToken ? 3600 : 300,
    });
  }

  loginUser(user: Pick<UsersModel, 'email' | 'id'>) {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
    };
  }

  async authenticateWithEmailAndPassword(
    user: Pick<UsersModel, 'email' | 'password'>,
  ) {
    // 2. 비밀번호가 맞는지 확인
    // 3. 모두 통과되면 찾은 사용자 정보 반환
    const existingUser = await this.usersService.getUserByEmail(user.email);

    // 1. 사용자가 존재하는지 확인 (email)
    if (!existingUser) {
      throw new UnauthorizedException('존재하지 않은 사용자입니다.');
    }

    /**
     * 1)입력된 비밀번호
     * 2)기존해쉬
     */
    const passOk = await bcrypt.compare(user.password, existingUser.password);
    if (!passOk) {
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    }

    return existingUser;
  }

  async loginWithEmail(user: Pick<UsersModel, 'email' | 'password'>) {
    const existingUser = await this.authenticateWithEmailAndPassword(user);

    return this.loginUser(existingUser);
  }

  async registerWithEmail(
    user: Pick<UsersModel, 'nickname' | 'email' | 'password'>,
  ) {
    const hash = await bcrypt.hash(user.password, HASH_ROUNDS);

    const newUser = await this.usersService.createUser({
      ...user,
      password: hash,
    });

    return this.loginUser(newUser);
  }
}
