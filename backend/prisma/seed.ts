import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const owner = await prisma.user.upsert({
    where: { email: 'lojista@pgdelivery.dev' },
    update: {},
    create: {
      name: 'Zé do Burger',
      email: 'lojista@pgdelivery.dev',
      phone: '+5524999990001',
      passwordHash: await argon2.hash('Gigante123'),
      roles: ['MERCHANT'],
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'cliente@pgdelivery.dev' },
    update: {},
    create: {
      name: 'Ana Souza',
      email: 'cliente@pgdelivery.dev',
      phone: '+5524999990002',
      passwordHash: await argon2.hash('Gigante123'),
      loyalty: { create: { points: 120 } },
      addresses: {
        create: {
          label: 'Casa', street: 'Rua 33', number: '120', district: 'Vila Santa Cecília',
          city: 'Volta Redonda', state: 'RJ', zipCode: '27260-000',
          latitude: -22.5137, longitude: -44.0956, isDefault: true,
        },
      },
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'burger-do-ze' },
    update: {},
    create: {
      slug: 'burger-do-ze',
      name: 'Burger do Zé',
      legalName: 'Burger do Zé LTDA',
      cnpj: '00000000000191',
      description: 'Smash burgers artesanais',
      latitude: -22.5203,
      longitude: -44.1042,
      addressLine: 'Av. Amaral Peixoto, 500',
      city: 'Volta Redonda',
      state: 'RJ',
      rating: 4.7,
      ratingCount: 1240,
      minOrderCents: 2000,
      deliveryFeeCents: 0,
      avgPrepMinutes: 18,
      isOpen: true,
      members: { create: { userId: owner.id, role: 'OWNER' } },
    },
  });

  const burgers = await prisma.category.create({
    data: { restaurantId: restaurant.id, name: 'Burgers', position: 1 },
  });

  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: burgers.id,
      name: 'X-Gigante',
      description: 'Pão brioche, blend 180 g, cheddar, cebola caramelizada',
      priceCents: 3890,
      promoPriceCents: 3290,
      isFeatured: true,
      optionGroups: {
        create: [
          {
            name: 'Ponto da carne', minSelect: 1, maxSelect: 1, position: 1,
            options: { create: [{ name: 'Ao ponto' }, { name: 'Bem passado' }] },
          },
          {
            name: 'Adicionais', minSelect: 0, maxSelect: 3, position: 2,
            options: { create: [{ name: 'Bacon', priceCents: 400 }, { name: 'Ovo', priceCents: 300 }] },
          },
        ],
      },
    },
  });

  console.log('Seed ok:', { customer: customer.email, merchant: owner.email, restaurant: restaurant.slug });
}

main().finally(() => prisma.$disconnect());
