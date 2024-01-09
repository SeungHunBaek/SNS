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
   * 토큰을 사용하는 방식
   *
   * 1) 사용자가 로그인 또는 회원가입을 진행하게 되면
   *    accessToken과 refreshToken을 발급받는다.
   * 2) 로그인 할때는 Basic 토큰과 함께 요청을 받는다
   *    Basic토큰은 '이메일:비밀번호'를 Base64로 변환한 값이다.
   *    예) {authorization: 'Basic: {Token}'}
   * 3) 아무나 접근 할 수 없는 정보는 (private route)를 접근할때는
   *    AccessToken을 Header에 추가하여 요청과 함께 보낸다.
   *    예) {authorization: 'Bearer: {Token}'}
   * 4) 토큰과 요청을 함께받은 서버는 토큰 검증을 통해 현재 요청을 보낸
   *    사용자가 누구인지 알 수 있다.
   * 5) 모든 토큰은 마료기간이 있다 만료기간이 지나면 새로운 토큰을 발급받아야 한다
   * 6) 토큰이 만료되면 토큰을 새로 발급받을수 있는 엔드포인트에 요청하여 새로운 토큰을 받급받는다
   */

  /**
   * Header로 부터 토큰을 받을 때 Bearer, Basic를 구별
   * {authorization: 'Basic: {Token}'}
   * {authorization: 'Bearer: {Token}'}
   */
  extractTokenFromHeader(header: string, isBearer: boolean) {
    const splitToken = header.split(' ');

    const prefix = isBearer ? 'Bearer' : 'Basic';

    if (splitToken.length !== 2 || splitToken[0] !== prefix) {
      throw new UnauthorizedException('잘못된 토근입니다.');
    }

    const token = splitToken[1];
    return token;
  }

  decodeBasicToken(base64String: string) {
    const decoded = Buffer.from(base64String, 'base64').toString('utf-8');
    const split = decoded.split(':');

    if (split.length !== 2) {
      throw new UnauthorizedException('잘못된 유형의 토큰입니다.');
    }

    const email = split[0];
    const password = split[1];

    return {
      email,
      password,
    };
  }

  /**
   * token 검증
   * @param token
   * @returns
   */
  verifyToken(token: string) {
    return this.jwtService.verify(token, {
      secret: JWT_SECRET,
    });
  }

  async rotateToken(token: string, isRefreshToken: boolean) {
    const decoded = this.jwtService.verify(token, {
      secret: JWT_SECRET,
    });

    /**
     * sub: id
     * email: email
     * type: access | refresh
     */
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException(
        '토큰의 재발급은 Refresh 토큰으로만 가능합니다.',
      );
    }
    return this.signToken(
      {
        ...decoded,
      },
      isRefreshToken,
    );
  }

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
