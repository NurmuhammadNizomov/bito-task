import { Tenant } from '../modules/tenant/tenant.model';
import { User } from '../modules/users/user.model';
import { Product } from '../modules/products/product.model';
import { connectDB } from '../config/db';
import { logger } from '../common/utils/logger';

// Simple shared password for all demo accounts — easy to type during review/testing.
const DEMO_PASSWORD = '123456';

interface SeedUser { email: string; name: string; role: 'ADMIN' | 'CASHIER'; phone: string }
interface SeedTenant {
  name: string;
  slug: string;
  email: string;
  phone: string;
  users: SeedUser[];
}

// Single demo tenant with real data.
const TENANTS: SeedTenant[] = [
  {
    name: 'Tenant A MCHJ',
    slug: 'tenant-a',
    email: 'info@tenant-a.uz',
    phone: '+998901111111',
    users: [
      { email: 'admin.a@demo.uz', name: 'Tenant A Admin', role: 'ADMIN', phone: '+998901111101' },
      { email: 'cashier.a@demo.uz', name: 'Tenant A Cashier One', role: 'CASHIER', phone: '+998901111102' },
      { email: 'cashier.a2@demo.uz', name: 'Tenant A Cashier Two', role: 'CASHIER', phone: '+998901111103' },
    ],
  },
];

const PRODUCTS_DATA: Array<{
  name: string; sku: string; salePrice: number; costPrice: number; stock: number;
}> = [
  { name: 'Coca-Cola 0.5L', sku: 'COLA-05', salePrice: 8000, costPrice: 5000, stock: 100 },
  { name: 'Coca-Cola 1L', sku: 'COLA-10', salePrice: 14000, costPrice: 9000, stock: 80 },
  { name: 'Fanta 0.5L', sku: 'FANTA-05', salePrice: 8000, costPrice: 5000, stock: 60 },
  { name: 'Sprite 0.5L', sku: 'SPRITE-05', salePrice: 8000, costPrice: 5000, stock: 60 },
  { name: 'Nestle Suv 0.5L', sku: 'WATER-05', salePrice: 3000, costPrice: 1500, stock: 200 },
  { name: 'Gamburger', sku: 'BURGER-01', salePrice: 25000, costPrice: 15000, stock: 50 },
  { name: 'Chizburger', sku: 'BURGER-02', salePrice: 28000, costPrice: 17000, stock: 40 },
  { name: 'Hot Dog', sku: 'HOTDOG-01', salePrice: 18000, costPrice: 10000, stock: 45 },
  { name: 'Shaurma', sku: 'SHAURMA-01', salePrice: 32000, costPrice: 20000, stock: 30 },
  { name: 'Pitsa (kichik)', sku: 'PIZZA-S', salePrice: 45000, costPrice: 28000, stock: 20 },
  { name: 'Kartoshka fri', sku: 'FRIES-01', salePrice: 15000, costPrice: 8000, stock: 60 },
  { name: 'Napaleon', sku: 'CAKE-01', salePrice: 22000, costPrice: 14000, stock: 25 },
  { name: 'Medovik', sku: 'CAKE-02', salePrice: 25000, costPrice: 16000, stock: 20 },
  { name: 'Chizkeyk', sku: 'CAKE-03', salePrice: 28000, costPrice: 18000, stock: 15 },
  { name: 'Pechene', sku: 'COOKIE-01', salePrice: 5000, costPrice: 3000, stock: 100 },
  { name: 'Salat Toshkent', sku: 'SALAD-01', salePrice: 18000, costPrice: 10000, stock: 15 },
];

async function seedTenant(def: SeedTenant, hashedPassword: string) {
  const tenant = await Tenant.create({
    name: def.name,
    slug: def.slug,
    email: def.email,
    phone: def.phone,
    address: 'Toshkent, Uzbekistan',
    settings: { currency: 'UZS', timezone: 'Asia/Tashkent', dateFormat: 'DD/MM/YYYY' },
  });
  const tenantId = tenant._id.toString();
  logger.info(`Tenant created: ${tenant.slug}`);

  // Users — all share DEMO_PASSWORD for easy testing.
  await User.create(
    def.users.map((u) => ({
      email: u.email,
      password: hashedPassword,
      name: u.name,
      role: u.role,
      tenantId,
      phone: u.phone,
      isActive: true,
    })),
  );
  logger.info(`  Users: ${def.users.map((u) => u.email).join(', ')}`);

  // Products
  await Product.insertMany(
    PRODUCTS_DATA.map((p) => ({
      name: p.name,
      sku: p.sku,
      salePrice: p.salePrice,
      costPrice: p.costPrice,
      stock: p.stock,
      tenantId,
      isActive: true,
    })),
  );
  logger.info(`  Products: ${PRODUCTS_DATA.length}`);
}

async function seed() {
  await connectDB();

  logger.info('Clearing existing data...');
  await Promise.all([
    Tenant.deleteMany({}),
    User.deleteMany({}),
    Product.deleteMany({}),
  ]);

  const bcrypt = await import('bcryptjs');
  const hashed = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const def of TENANTS) {
    await seedTenant(def, hashed);
  }

  logger.info(`Seeding complete! ${TENANTS.length} tenants, password for all users: "${DEMO_PASSWORD}"`);
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seeding failed', { error: err });
  process.exit(1);
});
