import { storage } from "./storage";
import { MemStorage } from "./storage";

export async function seedDatabase() {
  console.log("Seeding database with tube bender data...");
  
  // Create a temporary MemStorage instance to get the seeded data
  const memStorage = new MemStorage();
  const tubeBenders = await memStorage.getTubeBenders();
  
  // Check if data already exists
  const existing = await storage.getTubeBenders();
  if (existing.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }
  
  // Insert all tube benders into the database
  for (const bender of tubeBenders) {
    const { id, ...insertData } = bender;
    await storage.createTubeBender(insertData);
  }
  
  console.log(`Seeded ${tubeBenders.length} tube benders into database`);
}