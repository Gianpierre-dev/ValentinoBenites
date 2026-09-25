import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

type PrismaMock = {
  usuario: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

const crearPrismaMock = (): PrismaMock => ({
  usuario: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
});

const jwtMock = { signAsync: jest.fn().mockResolvedValue('token-firmado') };

describe('AuthService.actualizarCredenciales', () => {
  let prisma: PrismaMock;
  let service: AuthService;
  let usuario: {
    id: string;
    email: string;
    nombre: string | null;
    passwordHash: string;
  };

  beforeEach(async () => {
    prisma = crearPrismaMock();
    service = new AuthService(prisma as never, jwtMock as never);
    usuario = {
      id: 'u1',
      email: 'admin@fabiola.pe',
      nombre: 'Admin',
      passwordHash: await bcrypt.hash('Actual123!', 4),
    };
  });

  it('rechaza si no se indica ningún cambio', async () => {
    await expect(
      service.actualizarCredenciales('u1', { passwordActual: 'Actual123!' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza si la contrasena actual es incorrecta', async () => {
    prisma.usuario.findUnique.mockResolvedValue(usuario);

    await expect(
      service.actualizarCredenciales('u1', {
        passwordActual: 'equivocada',
        passwordNueva: 'NuevaClave1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });

  it('rechaza el correo nuevo si ya lo usa otro usuario', async () => {
    prisma.usuario.findUnique
      .mockResolvedValueOnce(usuario)
      .mockResolvedValueOnce({ id: 'u2' });

    await expect(
      service.actualizarCredenciales('u1', {
        passwordActual: 'Actual123!',
        emailNuevo: 'ocupado@correo.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('actualiza el correo verificando la contrasena actual', async () => {
    prisma.usuario.findUnique
      .mockResolvedValueOnce(usuario)
      .mockResolvedValueOnce(null);
    prisma.usuario.update.mockResolvedValue({
      ...usuario,
      email: 'nuevo@correo.com',
    });

    const resultado = await service.actualizarCredenciales('u1', {
      passwordActual: 'Actual123!',
      emailNuevo: 'nuevo@correo.com',
    });

    expect(resultado.email).toBe('nuevo@correo.com');
    const [{ data }] = prisma.usuario.update.mock.calls[0] as [
      { data: { email?: string; passwordHash?: string } },
    ];
    expect(data.email).toBe('nuevo@correo.com');
    expect(data.passwordHash).toBeUndefined();
  });

  it('actualiza la contrasena guardando un hash bcrypt, nunca el texto plano', async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce(usuario);
    prisma.usuario.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...usuario, ...data }),
    );

    await service.actualizarCredenciales('u1', {
      passwordActual: 'Actual123!',
      passwordNueva: 'NuevaClave1',
    });

    const [{ data }] = prisma.usuario.update.mock.calls[0] as [
      { data: { passwordHash: string } },
    ];
    expect(data.passwordHash).not.toBe('NuevaClave1');
    expect(await bcrypt.compare('NuevaClave1', data.passwordHash)).toBe(true);
  });
});
