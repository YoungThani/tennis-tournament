const { PrismaClient } = require('@prisma/client');

// One shared database connection for the whole app.
// Any file that needs the database does: const prisma = require('./db');
const prisma = new PrismaClient();

module.exports = prisma;
