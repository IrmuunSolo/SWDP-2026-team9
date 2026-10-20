import { All, Controller, Module, Req } from '@nestjs/common';
import { routes } from '@campusfind/contracts';
import { fail } from './http';
import { AuthRequest } from './session';
// LAST controller: reserves only documented future routes, never fabricates successful data.
// Replace each reservation with its real feature module as that story is implemented.
@Controller()
export class PlannedController {
  @All('{*path}') planned(@Req() req: AuthRequest) {
    const path = req.path.replace(/^\/api\/v1/, '');
    const route = routes.find(
      (r) =>
        r.status === 'planned' &&
        r.method.toUpperCase() === req.method &&
        new RegExp('^' + r.path.replace(/\{[^}]+\}/g, '[^/]+') + '$').test(path),
    );
    if (!route) fail(404, 'NOT_FOUND', 'API зам олдсонгүй');
    if (route.access === 'ADMIN' && req.user.role !== 'ADMIN')
      fail(403, 'FORBIDDEN', 'Админы эрх шаардлагатай');
    // Resource-level AUTHOR/PARTICIPANT/FINDER checks belong in future services.
    // No lookup, data or success response is exposed by a reservation.
    fail(501, 'NOT_IMPLEMENTED', `${route.id}: ${route.weekBlock}-р долоо хоногт хэрэгжинэ`);
  }
}
@Module({ controllers: [PlannedController] })
export class PlannedModule {}
