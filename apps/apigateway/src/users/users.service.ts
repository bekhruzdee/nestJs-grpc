import {
  Injectable,
  Inject,
  OnModuleInit,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateUserDto,
  PaginationDto,
  UpdateUserDto,
  USERS_SERVICE_NAME,
  UsersServiceClient,
} from '@app/common';
import { AUTH_SERVICE } from './constant';
import { ClientGrpc } from '@nestjs/microservices';
import { ReplaySubject } from 'rxjs';

@Injectable()
export class UsersService implements OnModuleInit {
  private usersService: UsersServiceClient;

  constructor(@Inject(AUTH_SERVICE) private client: ClientGrpc) {}

  onModuleInit() {
    this.usersService =
      this.client.getService<UsersServiceClient>(USERS_SERVICE_NAME);
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService
        .createUser(createUserDto)
        .toPromise();
      return {
        statusCode: HttpStatus.CREATED,
        message: 'User successfully created',
        data: user,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll() {
    try {
      const users = await this.usersService.findAllUsers({}).toPromise();
      return {
        statusCode: HttpStatus.OK,
        message: 'Users fetched successfully',
        data: users,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.usersService.findOneUser({ id }).toPromise();
      if (!user || !user.id) {
        throw new HttpException(
          `User with id ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        statusCode: HttpStatus.OK,
        message: `User with id ${id} fetched successfully`,
        data: user,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to fetch user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const { id: _ignoredId, ...rest } = updateUserDto;
      const user = await this.usersService
        .updateUser({ id, ...rest })
        .toPromise();

      if (!user || !user.id) {
        throw new HttpException(
          `User with id ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        statusCode: HttpStatus.OK,
        message: `User with id ${id} updated successfully`,
        data: user,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to update user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      const user = await this.usersService.removeUser({ id }).toPromise();
      if (!user || !user.id) {
        throw new HttpException(
          `User with id ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        statusCode: HttpStatus.OK,
        message: `User with id ${id} removed successfully`,
        data: user,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to remove user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  emailUsers() {
    const users$ = new ReplaySubject<PaginationDto>();
    users$.next({ page: 0, skip: 25 });
    users$.next({ page: 1, skip: 25 });
    users$.next({ page: 2, skip: 25 });
    users$.next({ page: 3, skip: 25 });

    users$.complete();

    let chunkNumber = 1;

    this.usersService.queryUsers(users$).subscribe((users) => {
      console.log('Chunk', chunkNumber, users);
      chunkNumber += 1;
    });
  }
}
