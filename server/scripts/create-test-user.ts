import { db } from "../db";
import { users } from "@shared/schema";
import { hash } from "bcrypt";
import { eq } from "drizzle-orm";

async function createTestUser() {
  try {
    // Check if test user already exists
    const email = 'test@example.com';
    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    
    if (existingUsers.length > 0) {
      console.log('Test user already exists:', existingUsers[0]);
      process.exit(0);
    }
    
    // Create a test user with bcrypt hashed password
    const hashedPassword = await hash('password123', 10);
    
    const [newUser] = await db.insert(users).values({
      email: email,
      username: 'testuser',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      active: true,
      lastLogin: null
    }).returning();
    
    console.log('Created test user:', newUser);
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();