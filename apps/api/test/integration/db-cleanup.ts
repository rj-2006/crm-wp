import { PrismaService } from '../../src/prisma/prisma.service';

export async function cleanDatabase(prisma: PrismaService) {
  // Delete child tables first to satisfy foreign key constraints
  await prisma.webhookEvent.deleteMany();
  await prisma.message.deleteMany();
  await prisma.campaignRecipient.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.messageTemplate.deleteMany();
  await prisma.whatsAppAccount.deleteMany();
  
  await prisma.consentLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.auditLog.deleteMany();
  
  await prisma.contactTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  
  // Delete the root parent table last
  await prisma.company.deleteMany();
}
