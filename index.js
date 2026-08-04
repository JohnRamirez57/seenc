require('dotenv/config');
const express = require("express"); 
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg"); 

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL, 
}); 

const app = express(); 
const prisma = new PrismaClient({
  adapter, 
}); 

app.use(express.json()); 

app.get("/db-health", async (req, res) => {
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 AS ok`;
    res.json({ connected: true, result });
  } catch (error) {
    res.status(500).json({ connected: false, error: error.message });
  }
});

// Get all users
app.get("/", async (req, res) => {
  const userCount = await prisma.user.count(); 
  res.json(
    userCount == 0
      ? "No users have been added yet."
      : "Some users have been added to the database.", 
  ); 
}); 
const PORT = 3000; 

async function start() {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`); 
  });

  try {
    await prisma.$connect();
    console.log("Prisma client initialized");
    const customerNames = await prisma.customer.findMany({
        include: {
            first_name: true,
            last_name: true
        }
    })
    console.log("Customer Names: ", JSON.stringify(customerNames))
  } catch (error) {
    console.error("Failed to connect to Postgres", error.message);
  }
}

start();