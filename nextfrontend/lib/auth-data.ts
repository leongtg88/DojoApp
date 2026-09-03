import { Role, User } from './types';

export const SEED_USERS: (User & { password: string })[] = [
  {
    id: 'usr_admin_01',
    name: 'Admin Tosei',
    email: 'admin@toseigusoku.com',
    password: 'Admin123!',
    role: Role.SUPERADMIN,
    emailVerified: true,
    createdAt: '2025-01-10T10:00:00Z',
    belt: 'Cinturón Negro 5to Dan',
  },
  {
    id: 'usr_inst_02',
    name: 'Sensei Rodríguez',
    email: 'instructor@toseigusoku.com',
    password: 'Instructor123!',
    role: Role.INSTRUCTOR,
    emailVerified: true,
    createdAt: '2025-02-14T15:30:00Z',
    belt: 'Cinturón Negro 3er Dan',
  },
  {
    id: 'usr_stud_03',
    name: 'Carlos Mendoza',
    email: 'alumno@test.com',
    password: 'Alumno123!',
    role: Role.STUDENT,
    emailVerified: true,
    createdAt: '2025-03-01T09:00:00Z',
    belt: 'Cinturón Verde',
  },
];

export const DOJO_INFO = {
  name: 'Tosei Gusoku Dojo',
  location: 'Plaza Lulie, Av. 27 de Febrero, Santo Domingo, R.D.',
  specialty: 'Karate Shito Ryu Inoue Ha',
  target: 'Niños desde 5 años y adultos',
  cta: 'Primera clase de prueba GRATIS',
  whatsapp: '+1 (829) 637-8733',
  whatsappLink: 'https://wa.me/18296378733',
  web: 'https://toseigusoku.com',
};
