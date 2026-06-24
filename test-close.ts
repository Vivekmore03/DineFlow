import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) { console.log('no restaurant'); return; }
  const table = await prisma.table.findFirst({ where: { restaurantId: restaurant.id } });
  
  // Create a dummy session
  const session = await prisma.diningSession.create({
    data: {
      restaurantId: restaurant.id,
      tableId: table!.id,
      status: "ACTIVE",
      customerToken: "test-token-" + Date.now(),
    }
  });
  console.log('Created session:', session.id);
  
  // Create a bill
  const bill = await prisma.bill.create({
    data: {
      restaurantId: restaurant.id,
      sessionId: session.id,
      billNumber: "TEST-" + Date.now(),
      subtotal: 100,
      taxRate: 5,
      taxAmount: 5,
      grandTotal: 105,
      paymentStatus: "PENDING",
    }
  });
  console.log('Created bill:', bill.id);
  
  // Attempt to close transactionally
  try {
    await prisma.$transaction(async (tx) => {
      await tx.bill.update({
        where: { id: bill.id },
        data: { paymentStatus: "PAID" },
      });
      await tx.diningSession.update({
        where: { id: session.id },
        data: { status: "COMPLETED" },
      });
      await tx.table.update({
        where: { id: session.tableId },
        data: { status: "AVAILABLE" },
      });
      await tx.billRequest.updateMany({
        where: { sessionId: session.id },
        data: { status: "COMPLETED" },
      });
    });
    console.log('Transaction SUCCESS');
  } catch (e) {
    console.error('Transaction FAILED:', e);
  }
}

test().finally(() => prisma.$disconnect());
