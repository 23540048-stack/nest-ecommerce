import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    // Nếu không có req.user (do Frontend chưa gửi Token)
    if (!user || !user.role) {
      throw new ForbiddenException(
        'Không tìm thấy thông tin người dùng hoặc Role!',
      );
    }

    // So sánh không phân biệt hoa thường
    const hasRole = requiredRoles.some(
      (role) => String(user.role).toLowerCase() === String(role).toLowerCase(),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập tài nguyên này!',
      );
    }

    return true;
  }
}
