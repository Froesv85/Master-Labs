import { Category, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROJECTS = [
  { title: 'Smart LED Matrix Display', category: Category.IoT },
  { title: '3D Printer Cable Organizer', category: Category.Printing3D },
  { title: 'Robotic Arm Gripper', category: Category.Robotics },
  { title: 'DIY CNC Router', category: Category.Woodworking },
  { title: 'LoRaWAN Weather Station', category: Category.IoT },
  { title: 'Resin Print Stand', category: Category.Printing3D },
  { title: 'Servo Motor Tester', category: Category.Robotics },
  { title: 'Woodworking Jig System', category: Category.Woodworking },
  { title: 'Smart Plant Watering', category: Category.IoT },
  { title: 'Modular Robot Platform', category: Category.Robotics },
];

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
    },
  });

  console.log('User ready:', user.email);

  await prisma.project.deleteMany({
    where: { creatorId: user.id },
  });

  await prisma.project.createMany({
    data: PROJECTS.map((project) => ({
      ...project,
      creatorId: user.id,
    })),
  });

  const total = await prisma.project.count({
    where: { creatorId: user.id },
  });

  console.log('Seed complete. Projects created:', total);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
