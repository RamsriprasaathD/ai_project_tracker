// Quick database connection test
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  console.log('\n🔍 Testing database connection...\n');
  
  try {
    await prisma.$connect();
    console.log('✅ SUCCESS! Database is connected and working!\n');
    console.log('Your login should work now. Try: http://localhost:3000/login\n');
    
    // Try to count users
    const userCount = await prisma.user.count();
    console.log(`📊 Database has ${userCount} users\n`);
    
    process.exit(0);
  } catch (error) {
    console.log('❌ FAILED! Database connection error:\n');
    console.log(error.message);
    console.log('\n🔧 To fix this:\n');
    console.log('1. Check if your database is running/active');
    console.log('2. Verify DATABASE_URL in .env file');
    console.log('3. For Supabase: Resume paused database in dashboard');
    console.log('4. OR: Use Neon database (see QUICK_DATABASE_FIX.md)\n');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
